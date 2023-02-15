import { ObjectId } from "mongodb";

export const idGenerator = {
  /**
   * 
   */
   objectId(id?: string) {
     return new ObjectId(id).toHexString();
   }
}