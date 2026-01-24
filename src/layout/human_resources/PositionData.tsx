import {} from "react";
import { useParams } from "react-router";
//

const PositionData = () => {
  const { positionId } = useParams();
  return <div>PositionData</div>;
};

export default PositionData;
