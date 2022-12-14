import { distroSetupByNetwork } from "../../config";
import classes from "./style.module.css";

interface Props {
  isDistroEnabled: boolean;
  distroAddress: string;
}
const Footer: React.FC<Props> = ({ isDistroEnabled, distroAddress }) => (
  <footer className={classes.footer}>
    <div className={classes.footerContainer}>
      <div className={classes.left}>
        {isDistroEnabled && (
          <>
            <span>Distribution contract: </span>
            {distroAddress === distroSetupByNetwork[1].distroAddress ? (
              <a
                href={`https://etherscan.io/address/${distroAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/etherscan.svg"
                  alt="View contract on Etherscan"
                  width={16}
                  height={16}
                />
              </a>
            ) : (
              <a
                href={`https://gnosisscan.io/address/${distroAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/gnosisscan.svg"
                  alt="View contract on Gnosisscan"
                  width={16}
                  height={16}
                />
              </a>
            )}
          </>
        )}
        <a
          href="https://github.com/gnosis/safe-token-distribution"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/github.png"
            alt="View contract source code on GitHub"
            width={16}
            height={16}
          />
        </a>
      </div>
      <div className={classes.right}>
        <a
          href="https://discord.gg/2jnnJx3Y"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/discordicon.svg"
            alt="Gnosis Guild Discord"
            width={16}
            height={16}
          />
        </a>
        <a
          href="https://twitter.com/gnosisguild"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/twittericon.svg"
            alt="Gnosis Guild Twitter"
            width={16}
            height={16}
          />
        </a>

        <div className={classes.divider} />

        <a
          className={classes.gg}
          href="https://www.gnosisguild.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Built by Gnosis Guild{" "}
          <span className={classes.logo}>
            <img
              src="/gnosisguild.png"
              alt="Gnosis Guild"
              width={32}
              height={32}
            />
          </span>
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
