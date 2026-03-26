export interface Recipes { RecipeId: string; Title: string; Introduction: string; Serving: string; Image: string; }
export interface Ingredients { RecipeId: string; OrderNo: number; Name: string; Quantity: string }
export interface Instructions { RecipeId: string; OrderNo: number; Detail: string; }
export interface KeyWord { Word: string; }
export interface RankModels { Rank1: Recipes[]; Rank2: Recipes[]; Rank3: Recipes[]; }

export class RecipeModel {
  [x: string]: {};

  constructor() {
    this.instance = this;
    this.instance.setModel();
  }

  getInstance() {
    if (this.instance) {
      return this.instance;
    }
    return this;
  }

  private instance: RecipeModel
  static RECIPE_ID = "RecipeId"
  static TITLE = "Title"
  static INTRODUCTION = "Introduction"
  static SERVING = "Serving"
  static IMAGE = "Image"
  static NAME = "Name"
  static INGREDIENTS = "Ingredients"
  static QUANTITY = "Quantity"
  static DETAIL = "Detail"
  static ORDER_NO = "OrderNo"

  public recipeModel: Recipes = {
    RecipeId: "",
    Title: "",
    Introduction: "",
    Serving: "",
    Image: ""
  };

  public recipeList: Recipes[] = [
    {
      RecipeId: "",
      Title: "",
      Introduction: "",
      Serving: "",
      Image: ""
    }
  ];
  public rankModel: RankModels = {
    Rank1: [],
    Rank2: [],
    Rank3: []
  };



  public keyWordModel: KeyWord[] = [
    {
      Word: ""
    }
  ]

  public ingredientModel: Ingredients[] = [
    {
      RecipeId: "",
      OrderNo: 1,
      Name: "",
      Quantity: ""
    }
  ];
  public instModel: Instructions[] = [
    {
      RecipeId: "",
      OrderNo: 1,
      Detail: ""
    }
  ];

  public models: { Status: number; Recipes: any[]; Ingredients: any[]; Instructions: any[]; } =
    {
      Status: 0,
      Recipes: [],
      Ingredients: [],
      Instructions: []
    };



  public getHomeModels: { Recipes: any[]; } =
    {
      Recipes: [{
        RecipeId: "1234",
        Title: "ポリポリ食感ラーメン",
        Info: "",
        Serving: 0,
        Image: "food_sample.jpg"
      },
      {
        RecipeId: "88888",
        Title: "ぱりぱりラーメン",
        Info: "",
        Serving: 0,
        Image: "PXL_20210904_024105399.jpg"
      },
      {
        RecipeId: "77777",
        Title: "醤油ラーメン",
        Info: "",
        Serving: 0,
        Image: "PXL_20211001_114925406.PORTRAIT.jpg"
      },
      {
        RecipeId: "66666",
        Title: "しおラーメン",
        Info: "",
        Serving: 0,
        Image: "PXL_20211016_024927232.jpg"
      }],
    };

  public setModel() {
    this.models.Recipes[0] = this.recipeModel
    this.models.Ingredients = this.ingredientModel
    this.models.Instructions = this.instModel
  }

  public getModel() {
    this.models.Recipes[0] = this.recipeModel
    this.models.Ingredients[0] = this.ingredientModel
    this.models.Instructions[0] = this.instModel
    return this.models
  }
}