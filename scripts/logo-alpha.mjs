import sharp from 'sharp'
import { join } from 'node:path'

/**
 * Remove only the navy background connected to the outer edge.
 * Enclosed navy areas remain untouched (important for the round seal).
 * Never change the source image; emit transparent WebP variants (lossless by default).
 */
export async function buildTransparentLogo(root, sourceRelative, variants) {
 const src=join(root,sourceRelative)
 const {data,info}=await sharp(src).ensureAlpha().raw().toBuffer({resolveWithObject:true})
 const {width,height,channels}=info
 const count=width*height
 const roundSeal=sourceRelative.includes('徽章')
 const mask=new Uint8Array(count)
 const queue=new Int32Array(count)
 let start=0,end=0
 const matches=(at)=>{
  if(roundSeal){
   const x=at%width,y=Math.floor(at/width)
   const normalizedRadius=Math.hypot((x-(width-1)/2)/(width/2),(y-(height-1)/2)/(height/2))
   if(normalizedRadius<.94)return false // keep the original navy inside the round seal
  }
  const i=at*channels
  const r=data[i],g=data[i+1],b=data[i+2]
  // This art was supplied on a midnight-navy background.
  // Pick low-luminance navy only, not the golden artwork.
  return r<56 && g<52 && b<73 && b>=r-8
 }
 function enqueue(at) {
  if(at<0||at>=count||mask[at])return
  mask[at]=1
  if(matches(at))queue[end++]=at
 }
 for(let x=0;x<width;x++){enqueue(x);enqueue((height-1)*width+x)}
 for(let y=0;y<height;y++){enqueue(y*width);enqueue(y*width+width-1)}
 let removed=0
 while(start<end){
  const at=queue[start++]
  const x=at%width,y=Math.floor(at/width)
  data[at*channels+3]=0
  removed++
  if(x>0)enqueue(at-1)
  if(x<width-1)enqueue(at+1)
  if(y>0)enqueue(at-width)
  if(y<height-1)enqueue(at+width)
 }
 // Prevent dark matte pixels at the shape boundary from producing a hard rim.
 // Keep the interior of the original art intact.
 for(let y=1;y<height-1;y++){
  for(let x=1;x<width-1;x++){
   const at=y*width+x
   if(data[at*channels+3]===0)continue
   let neighboring=0
   for(const d of [-1,1,-width,width]){
    if(data[(at+d)*channels+3]===0)neighboring++
   }
   if(neighboring>0){
    const i=at*channels
    const brightness=Math.max(data[i],data[i+1],data[i+2])
    if(brightness<125)data[i+3]=Math.min(data[i+3],Math.max(80,Math.round((brightness/125)*255)))
   }
  }
 }
 let left=width,top=height,right=-1,bottom=-1
 for(let y=0;y<height;y++){
  for(let x=0;x<width;x++){
   const at=y*width+x
   if(data[at*channels+3]===0)continue
   if(x<left)left=x
   if(x>right)right=x
   if(y<top)top=y
   if(y>bottom)bottom=y
  }
 }
 if(right<left || bottom<top || removed<count*.1) {
  throw new Error('Logo background mask check failed: '+sourceRelative+' removed '+removed+'/'+count)
 }
 const margin=8
 left=Math.max(0,left-margin);top=Math.max(0,top-margin)
 right=Math.min(width-1,right+margin);bottom=Math.min(height-1,bottom+margin)
 for(const {path,maxWidth,quality} of variants) {
  let pipe=sharp(data,{raw:{width,height,channels}}).extract({left,top,width:right-left+1,height:bottom-top+1})
  if(maxWidth)pipe=pipe.resize({width:maxWidth,withoutEnlargement:true})
  const meta=await pipe.webp(quality ? {quality,alphaQuality:100,effort:6,smartSubsample:true} : {lossless:true,effort:6}).toFile(join(root,'public','images',path))
  console.log(path+': transparent '+meta.width+'x'+meta.height+' / '+(meta.size/1024).toFixed(0)+' KB / masked '+Math.round(removed/count*100)+'%')
 }
}
