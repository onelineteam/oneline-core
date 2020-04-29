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