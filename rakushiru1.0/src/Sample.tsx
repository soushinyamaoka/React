import React from "react";

interface Props {
  num: string;
}

class Sample extends React.Component<Props> {
  render() {
    return <p>{this.props.num}つ目のコンポーネント</p>;
  }
}

export default Sample;