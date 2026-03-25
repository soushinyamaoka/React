import Service from '../../module/Service';
import "styles/SpMake.css";

let service: Service = new Service();
const DeleteButton = (props: any) => {
  return (
    <>
      <button
        className="delete"
        onClick={() => service.delRow(props.index, props.modelList, props.setModel)}
      >削除</button>
    </>
  );
};

export default DeleteButton;