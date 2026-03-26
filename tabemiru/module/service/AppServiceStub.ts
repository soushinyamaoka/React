import axios from 'axios';
import config from '../../config.json';
import path from 'path'
import fsPromises from 'fs/promises'
import { KeyWord, Ingredients, Instructions } from '../model/RecipeModel';
import AppServiceInterface from './AppServiceInterface';
import { Const } from '../common/Const';
import { ChangeEvent } from 'react';
import { HomeJson } from '../common/JsonInterface';

export default class AppServiceStub implements AppServiceInterface{

  model: any = null
  static REQ_SAVE_RECIPE: string = "saveRecipe"

  public send(req: any): any {
    return require("public/json/stub_001.json")
  }

  getUrl(key: string): string {
    throw new Error('Method not implemented.');
  }
  getImagePath(name: string): string {
    throw new Error('Method not implemented.');
  }
  getDefPath(): string {
    throw new Error('Method not implemented.');
  }
  getRank1(): string {
    throw new Error('Method not implemented.');
  }
  getKeyWord(): KeyWord[] {
    throw new Error('Method not implemented.');
  }
  searchRecipe(req: any) {
    throw new Error('Method not implemented.');
  }
  selectRecipe(req: any) {
    throw new Error('Method not implemented.');
  }
  getData() {
    throw new Error('Method not implemented.');
  }
  add(model: any, setModel: any, keyNo: any, recipeId: any) {
    throw new Error('Method not implemented.');
  }
  upRow(n: any, model: any, setModel: any): void {
    throw new Error('Method not implemented.');
  }
  downRow(n: any, model: any, setModel: any): void {
    throw new Error('Method not implemented.');
  }
  delRow(n: any, model: any, setModel: any) {
    throw new Error('Method not implemented.');
  }
  changeValue(e: ChangeEvent<any>, index: number, model: any, setModel: any, key: string) {
    throw new Error('Method not implemented.');
  }
  onFileChange(e: ChangeEvent<HTMLInputElement>, setLocalFile: any, setFile: any) {
    throw new Error('Method not implemented.');
  }



}