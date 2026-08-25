export abstract class BaseModel {
  public id!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public isDeleted!: boolean;
}
