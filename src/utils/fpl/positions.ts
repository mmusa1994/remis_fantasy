export type PositionCode = 'GK' | 'DEF' | 'MID' | 'FWD';

export const getPositionCode = (elementType: number): PositionCode => {
  switch (elementType) {
    case 1:
      return 'GK';
    case 2:
      return 'DEF';
    case 3:
      return 'MID';
    case 4:
      return 'FWD';
    default:
      return 'MID';
  }
};