import React, { useEffect, useState } from "react";
import { useNetwork } from "wagmi";

import AllocationInfo from "../components/AllocationInfo";
import CalendarReminder from "../components/CalendarReminder";
import MainActionButton from "../components/MainActionButton";
import { ClaimStage } from "../components/MainActionButton/ClaimButton";
import classes from "./HomePage.module.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

import { distroSetup } from "../config";

const HomePage = () => {
  const network = useNetwork();
  const { isDistroEnabled } = distroSetup(network);
  const [claimStage, setClaimStage] = useState<ClaimStage>(ClaimStage.Idle);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;
    if (claimStage === ClaimStage.Error || claimStage === ClaimStage.Success) {
      timeoutId = setTimeout(() => setClaimStage(ClaimStage.Idle), 3000);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [claimStage]);

  return (
    <div className={classes.container}>
      <Header />
      <main className={classes.main}>
        <AllocationInfo isDistroEnabled={isDistroEnabled} />

        {isDistroEnabled && (
          <>
            <MainActionButton onProgress={setClaimStage} />
            <CalendarReminder />
            {claimStage !== ClaimStage.Idle && <p>{claimStage}</p>}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
