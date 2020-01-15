import { ObjectID } from "mongodb";

export const idGenerator = {
  /**
   * 
   */
   objectId(id?: string) {
     return new ObjectID(id).toHexString();
   }
}