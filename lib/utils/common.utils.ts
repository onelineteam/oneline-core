export function parsePage(total: number, index: number, size: number) {
  const page = Math.ceil(total/size);
  const next = (index * size) >= total ? index: index+1;
  const prev = index <= 1 ? 1 : index - 1;
  return { 
     total: total,
     pages: page,
     next: next,
     prev: prev
  }
}

export function padLeft(value: number): string {
   return value < 10 ? `0${value}` : `${value}`;
}

export function time_now() {
   const now = new Date();
   let month:any = now.getMonth() + 1;
   month = month < 10 ? "0" + month : month;

  
   let time =  now.getFullYear() + '-' + padLeft(now.getMonth() + 1) + '-' + padLeft(now.getDate());
   time += " " + padLeft(now.getHours()) + ":" + padLeft(now.getMinutes()) + ":" + padLeft(now.getSeconds());
   return time;
}