import { supabase } from './supabase'
async function webp(file:File, maxWidth:number, quality:number):Promise<Blob> {
 const bitmap=await createImageBitmap(file)
 const scale=Math.min(1,maxWidth/bitmap.width)
 const canvas=document.createElement('canvas')
 canvas.width=Math.round(bitmap.width*scale)
 canvas.height=Math.round(bitmap.height*scale)
 const ctx=canvas.getContext('2d')
 if(!ctx){bitmap.close();throw new Error('此瀏覽器無法處理圖片')}
 ctx.imageSmoothingEnabled=true
 ctx.imageSmoothingQuality='high'
 ctx.drawImage(bitmap,0,0,canvas.width,canvas.height)
 bitmap.close()
 const result=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(new Error('無法轉換 WebP')),'image/webp',quality))
 return result
}
export async function uploadStaffImage(file:File,staffId:string):Promise<{full:string;thumb:string}> {
 if(!supabase)throw new Error('尚未設定 Supabase')
 if(!file.type.startsWith('image/'))throw new Error('請上傳圖片檔')
 if(file.size>24*1024*1024)throw new Error('來源圖片不可超過 24MB')
 // Keep the source file unchanged on disk. Generate web-friendly variants before upload.
 const [full,thumb]=await Promise.all([webp(file,2000,.94),webp(file,760,.89)])
 const stamp=Date.now()
 const fullPath='staff/'+staffId+'/'+stamp+'-full.webp'
 const thumbPath='staff/'+staffId+'/'+stamp+'-thumb.webp'
 for (const [path,blob] of [[fullPath,full],[thumbPath,thumb]] as const) {
  const {error}=await supabase.storage.from('staff-media').upload(path,blob,{contentType:'image/webp',upsert:false,cacheControl:'31536000'})
  if(error)throw error
 }
 return {full:supabase.storage.from('staff-media').getPublicUrl(fullPath).data.publicUrl,
 thumb:supabase.storage.from('staff-media').getPublicUrl(thumbPath).data.publicUrl}
}
