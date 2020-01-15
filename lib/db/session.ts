export default interface Session {
  open();
  close();
  findCore(table: string, index: number, size: number, filter: Object, sort?: any) : Promise<any[]>;
  
  find(table: string, filter: any, sort?: any, fields?: any): Promise<any[]>;
  saveItem(table: string, bean:Object);
  updateItem(table: string, bean: Object, filter: Object);
  deleteItem(table: string, filter: Object);
  findByNosql(table: string, key: string, sql:any);
}