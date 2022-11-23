import classes from "./style.module.css";

const Footer: React.FC = () => (
  <footer className={classes.footer}>
    <div className={classes.footerContainer}>
      <div className={classes.left}>
        <span>Distribution contract: </span>
        {/* {connectedChainId === 100 ? (
              <a
                href="https://blockscout.com/xdai/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/etherscan.svg"
                  alt="View contract on Gnosis Chain Blockscout"
                  width={16}
                  height={16}
                />
              </a>
            ) : ( */}
        <a
          href="https://etherscan.io/"
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
