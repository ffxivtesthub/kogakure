import sharp from 'sharp'
import { readdir, mkdir, stat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
const root=resolve(process.cwd())
const out=join(root,'public','images')
await mkdir(out,{recursive:true})
const report=[]
async function exportImage(source,name,opts={}){
 const from=join(root,source)
 const before=(await stat(from)).size
 let pipeline=sharp(from).rotate()
 if(opts.width)pipeline=pipeline.resize({width:opts.width,withoutEnlargement:true})
 const img=await pipeline.webp(opts.lossless?{lossless:true,effort:6}:{quality:opts.quality??92,effort:5,smartSubsample:true}).toFile(join(out,name))
 report.push({name,source,originalBytes:before,outputBytes:img.size,width:img.width,height:img.height,reductionPercent:Math.round((1-img.size/before)*100)})
 console.log(name+': '+(before/1024/1024).toFixed(2)+'MB -> '+(img.size/1024).toFixed(0)+'KB ('+report.at(-1).reductionPercent+'%)')
}
await exportImage('狐隱LOGO/狐隱金彩櫻花物語.png','logo-wide.webp',{lossless:true})
await exportImage('狐隱LOGO/狐隱金彩櫻花物語.png','logo-wide-display.webp',{width:1150,lossless:true})
await exportImage('狐隱LOGO/狐隱之湯：金月白狐徽章.png','logo-mark.webp',{lossless:true})
await exportImage('狐隱LOGO/狐隱之湯：金月白狐徽章.png','logo-mark-small.webp',{width:140,lossless:true})
await exportImage('員工圖/FBK2.png','staff-01.webp',{width:1900,quality:94})
await exportImage('員工圖/FBK2.png','staff-01-small.webp',{width:800,quality:90})
await exportImage('員工圖/99.png','staff-02.webp',{width:1900,quality:94})
await exportImage('員工圖/99.png','staff-02-small.webp',{width:800,quality:90})
const scenes=(await readdir(join(root,'場景照'))).filter(n=>/\.(png|jpe?g|webp)$/i.test(n)).sort()
for(let i=0;i<scenes.length;i++){
 const src='場景照/'+scenes[i]
 const n=String(i+1).padStart(2,'0')
 await exportImage(src,'scene-'+n+'.webp',{width:1900,quality:92})
 await exportImage(src,'scene-'+n+'-small.webp',{width:900,quality:86})
}
await writeFile(join(out,'optimization-report.json'),JSON.stringify({generatedAt:new Date().toISOString(),files:report},null,2),'utf8')
console.log('Original image folders are unchanged. Web assets saved in public/images.')
