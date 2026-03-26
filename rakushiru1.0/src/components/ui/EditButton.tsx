import { useHistory } from "react-router-dom";
import "../../SpMake.css";

const EditButton = (props) => {
  const history: any = useHistory();
  const editData = () => {
    history.push("/MakeRecipes/" + props.recipeId); // 画面遷移
  };
  return (
    <>
      <button className="edit-Button edit-Button--contained">
        <div className="edit-Button-body edit-Button-body--contained"
          onClick={(e) => { editData() }}
        >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;編集&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
      </button>
    </>
  );
};

export default EditButton;