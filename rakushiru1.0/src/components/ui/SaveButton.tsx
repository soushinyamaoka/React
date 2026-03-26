import { useHistory } from "react-router-dom";
import { RecipeModel, Recipes, Ingredients, Instructions } from '../../module/RecipeModel';
import Service from '../../module/Service';
import "../../SpMake.css";

const SaveButton = (props) => {
  const history: any = useHistory();
    // 保存
    const saveRecipe = () => {
      let modelIns: RecipeModel = new RecipeModel();
      let service: Service = new Service()

      let recipe_copy: Recipes = props.recipeModel
      let inst_copy: Instructions[] = props.instModel.slice()
      let ing_copy: Ingredients[] = props.ingModel.slice()
      let file: File = props.file
  
      // TODO:要見直し
      // 画像ファイル名をセット
      recipe_copy.Image = recipe_copy.RecipeId + ".jpg"
      // 未登録の場合、初期値をセット
      if (inst_copy.length === 0) {
        inst_copy = [...inst_copy, modelIns.instModel[0]]
        inst_copy[0].RecipeId = recipe_copy.RecipeId
      }
      // 未登録の場合、初期値をセット
      if (ing_copy.length === 0) {
        ing_copy = [...ing_copy, modelIns.ingredientModel[0]]
        ing_copy[0].RecipeId = recipe_copy.RecipeId
      }
  
      // 保存用パラメータをセット
      modelIns.models.Recipes[0] = recipe_copy;
      modelIns.models.Instructions = inst_copy;
      modelIns.models.Ingredients = ing_copy;
      service.reqParam.ReqCode = "saveRecipe";
      service.reqParam.Data = modelIns.models;
  
      // 保存
      service.send(service.reqParam, file).then(res => {
        if (res.status !== 200 || (res.data && res.data.Status !== 0)) {
          alert("保存に失敗しました")
        } else {
           // 画面遷移
          history.push("/RecipesInfo/" + recipe_copy.RecipeId + "/");
          alert("保存しました")
        }
      })
    };
  return (
    <>
      <button className="edit-Button edit-Button--contained">
              <div className="edit-Button-body edit-Button-body--contained"
                onClick={(e) => { saveRecipe() }}
              >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;保存&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
            </button>
    </>
  );
};

export default SaveButton;