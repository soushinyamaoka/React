import React from "react";
import PcHome from './page/pc/PcHome';
import SpHome from './page/sp/Home';

const Home = () => {
  return (
    <div>
      <div className="is-pc">
        <PcHome />
      </div>
      <div className="is-sp">
        <SpHome />
      </div>
    </div>

  );
}

export default Home;