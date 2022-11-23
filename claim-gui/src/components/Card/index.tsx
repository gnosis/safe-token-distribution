import classes from "./style.module.css";
import clsx from "clsx";

type Props = {
  className?: string;
  children: React.ReactNode;
};

const Card: React.FC<Props> = ({ children, className }) => (
  <div className={clsx(classes.card, className)}>{children}</div>
);

export default Card;
