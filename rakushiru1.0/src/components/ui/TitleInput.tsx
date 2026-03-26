import { RecipeModel } from '../../module/RecipeModel';
import { Const } from '../../module/Const';
import Service from '../../module/Service';
import "../../SpMake.css";

let service: Service = new Service(); 
const TitleInput = (props) => {
  return (
    <>
      <input
        type="text"
        className={props.className}
        placeholder={Const.PH_TITLE}
        defaultValue={props.model[RecipeModel.TITLE]}
        maxLength={20}
        onChange={(e) => service.changeValue(e, 0, props.model, props.setModel, RecipeModel.TITLE)}
      ></input>

    </>
  );
};

export default TitleInput;