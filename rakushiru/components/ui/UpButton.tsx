import Service from '../../module/Service';
import "styles/SpMake.css
";

let service: Service = new Service();
const UpButton = (props: any) => {
  return (
    <>
      <button
        className="up-button"
        style={{ display: "inline-block" }}
        onClick={() => service.upRow(props.index, props.modelList, props.setModel)}
      >↑</button>
    </>
  );
};

export default UpButton;