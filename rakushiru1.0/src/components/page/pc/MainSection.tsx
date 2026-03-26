import React from "react";
import Ranking from './Ranking';
import Articles from './Articles';

const MainSection = () => {
    return (
      <div className="PcRoot-section" >
        <Ranking />
        <Articles />
      </div>
    );
  }

export default MainSection;