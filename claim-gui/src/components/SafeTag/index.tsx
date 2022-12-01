import classes from "./style.module.css";

const SafeTag: React.FC = () => {
  return (
    <span className={classes.tag}>
      <img src="/Safe_Logos_Symbol_Black.svg" alt="Safe Logo" />
      <span className={classes.name}>Safe</span>
    </span>
  );
};

export default SafeTag;
