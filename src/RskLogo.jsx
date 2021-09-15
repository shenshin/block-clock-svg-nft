/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

/*
 * Note that this file is used for experimentation purposes -
 * the actual rendering happens on-chain, within the smart contract.
 */

const RskLogo = ({ rskBlockNumber, btcBlockNumber, btcColor, rskColor }) => {
  // Minutes hand rotate:
  const getRskAngle = () => (rskBlockNumber % 20) * 18 + 90;
  // Hour hand rotate:
  const getBtcAngle = () => (btcBlockNumber % 6) * 60 + 90;
  return (
    <svg
      width="640"
      height="640"
      stroke="#000"
      strokeWidth="10"
      fill="#fff"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(320,320)">
        <polygon points="0 -134,120 -60,120 60,0 134,-120 60,-120 -60" />
        <line x1="0" y1="-134" x2="0" y2="134" />
        <line x1="120" y1="-60" x2="-120" y2="60" />
        <line x1="120" y1="60" x2="-120" y2="-60" />
        <circle cx="0" cy="-134" r="25" />
        <circle cx="120" cy="-60" r="25" />
        <circle cx="120" cy="60" r="25" />
        <circle cx="0" cy="134" r="25" />
        <circle cx="-120" cy="60" r="25" />
        <circle cx="-120" cy="-60" r="25" />
        <circle cx="0" cy="0" r="25" />
        <g strokeWidth="6">
          <ellipse
            cx="-229"
            cy="0"
            rx="60"
            ry="32"
            /* bitcoin block number --> large leaf */
            fill={`#${btcColor}`}
            transform={`rotate(${getBtcAngle()}, 0, 0)`}
          />
          <ellipse
            cx="-209"
            cy="0"
            rx="40"
            ry="21"
            /* rsk block number --> small leaf */
            fill={`#${rskColor}`}
            transform={`rotate(${getRskAngle()}, 0, 0)`}
          />
        </g>
      </g>
    </svg>
  );
};

export default RskLogo;
