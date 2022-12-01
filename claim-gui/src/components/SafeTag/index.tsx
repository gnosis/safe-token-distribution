import classes from "./style.module.css";

const SafeTag: React.FC = () => {
  return (
    <span className={classes.tag}>
      <img src="/Safe_Logos_Symbol_Black.svg" />
      <span className={classes.name}>Safe</span>
    </span>
  );
};

export default SafeTag;
