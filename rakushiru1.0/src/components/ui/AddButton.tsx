import Service from '../../module/Service';
import { Const } from '../../module/Const';
import "../../SpMake.css";

let service: Service = new Service();
const AddButton = (props) => {
  return (
    <>
      <button
        className="add"
        onClick={() => service.add(props.model, props.setModel, Const.RECIPE_INGRE_NO, props.recipeId)}
      >材料を追加</button>
    </>
  );
};

export default AddButton;