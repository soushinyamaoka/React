import { RecipeModel } from '../../module/RecipeModel';
import { Const } from '../../module/Const';
import Service from '../../module/Service';
import "../../SpMake.css";

let service: Service = new Service();
const IntroTextarea = (props) => {
  return (
    <>
      <textarea
        placeholder={Const.PH_INTRODUCTION}
        className={props.className}
        defaultValue={props.model[RecipeModel.DETAIL]}
        maxLength={60}
        onChange={(e) => service.changeValue(e, 0, props.model, props.setModel, RecipeModel.INTRODUCTION)}
      ></textarea>

    </>
  );
};

export default IntroTextarea;