import clsx from "clsx";
import {
  CalendarOptions,
  GoogleCalendar,
  ICalendar,
  OutlookCalendar,
} from "datebook";
import { useState } from "react";
import classes from "./style.module.css";

const CalendarReminder: React.FC = () => {
  const [showOptions, setShowOptions] = useState(false);
  const now = new Date();
  const baseCalDateStart = `${now.getFullYear()}-${now.getMonth()}-15T12:00:00`;
  const baseCalDateEnd = `${now.getFullYear()}-${now.getMonth()}-15T12:20:00`;

  const calConfig: CalendarOptions = {
    title: "Claim SAFE tokens from GnosisDAO",
    location: "safe-claim.gnosis.io",
    description: "",
    start: new Date(baseCalDateStart),
    end: new Date(baseCalDateEnd),
    recurrence: {
      frequency: "MONTHLY",
      interval: 1,
    },
  };

  const googleCal = new GoogleCalendar(calConfig);
  const outlookCal = new OutlookCalendar(calConfig);
  const ical = new ICalendar(calConfig);

  const iCalDownload = async () => {
    const blob = new Blob([ical.render()], {
      type: "text/calendar",
    });
    const a = document.createElement("a");
    a.download = "safe-claim-reminder.ics";
    a.href = URL.createObjectURL(blob);
    a.addEventListener("click", (e) => {
      setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
    });
    a.click();
  };

  return (
    <div className={clsx(classes.calendar, showOptions && classes.open)}>
      <button
        className={classes.showButton}
        onClick={() => setShowOptions(!showOptions)}
      >
        <div>Get reminded to claim every month</div>
        <img
          className={classes.arrow}
          alt="Expand arrow"
          src="/arrow.svg"
          height={12}
          width={12}
        />
      </button>
      <ul>
        <li>
          <button
            onClick={() => {
              iCalDownload();
            }}
          >
            iCal
          </button>
        </li>
        <li>
          <a href={googleCal.render()} target="_blank" rel="noreferrer">
            <button>Google</button>
          </a>
        </li>
        <li>
          <a href={outlookCal.render()} target="_blank" rel="noreferrer">
            <button>Outlook</button>
          </a>
        </li>
      </ul>
    </div>
  );
};

export default CalendarReminder;
