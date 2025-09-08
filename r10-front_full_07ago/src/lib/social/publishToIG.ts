import { generateFeedBuffer } from "./generateFeed";
import { makeTempUrl } from "./makeTempUrl";
import { buildCaption } from "./buildCaption";

export async function publishToInstagram({ title, hat, imageUrl, caption, origin }:{
  title:string; hat:string; imageUrl?:string; caption?:string; origin:string;
}){
  const buf = await generateFeedBuffer({
    title, hat,
    imageUrl: imageUrl || "https://picsum.photos/1080/1350",
    overlayUrl: "/templates/r10/overlay.png"
  });
  const ttl = Number(process.env.SOCIAL_TMP_TTL_MIN||'20');
  const tempUrl = makeTempUrl({ buffer:buf, ttlMin:ttl, origin, secret:process.env.SOCIAL_TMP_SECRET||'r10' });
  const CAPTION = caption || buildCaption(title);
  const BID = process.env.IG_BUSINESS_ID!;
  const TOKEN = process.env.IG_ACCESS_TOKEN!;

  const create = await fetch(`https://graph.facebook.com/v19.0/${BID}/media?access_token=${TOKEN}`,{
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ image_url: tempUrl, caption: CAPTION })
  }).then(r=>r.json());

  if(!create.id) return { ok:false, step:'create', error:create };

  const publish = await fetch(`https://graph.facebook.com/v19.0/${BID}/media_publish?access_token=${TOKEN}`,{
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ creation_id: create.id })
  }).then(r=>r.json());

  if(!publish.id) return { ok:false, step:'publish', error:publish };

  return { ok:true, id: publish.id, imageUrl: tempUrl, caption: CAPTION };
} 