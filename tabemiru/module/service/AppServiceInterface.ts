import { KeyWord, Ingredients, Instructions } from '../model/RecipeModel';

export default interface AppServiceInterface {
  getUrl(key: string): string;

  getImagePath(name: string): string;

  getDefPath(): string;

  getRank1(): string;

  getKeyWord(): KeyWord[];

  send(req: any): any;

  searchRecipe(req: any): any

  selectRecipe(req: any): any;

  getData(): any

  add(model: any, setModel: any, keyNo: any, recipeId: any): any;

  upRow(n: any, model: any, setModel: any): void;

  downRow(n: any, model: any, setModel: any): void;

  delRow(n: any, model: any, setModel: any): any;

  changeValue(e: React.ChangeEvent<any>,
    index: number, model: any, setModel: any, key: string): any;

  onFileChange(e: React.ChangeEvent<HTMLInputElement>, setLocalFile: any, setFile: any): any;

}