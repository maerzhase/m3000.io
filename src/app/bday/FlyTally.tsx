import styles from "./page.module.css";
export const MAX_FLY_TALLY = 25;

export default function FlyTally({ count }: { count: number }) {
  const visible = Math.min(count, MAX_FLY_TALLY);
  const groups = Math.ceil(visible / 5);

  return (
    <span className={styles.flyTally} role="status" aria-live="polite">
      <span className={styles.srOnly}>
        {count > 0 ? `${count} ${count === 1 ? "fly" : "flies"} swatted` : ""}
      </span>
      {count > 0 && (
        <span className={styles.tallyMarks} aria-hidden="true">
          <svg
            viewBox="0 0 160 28"
            preserveAspectRatio="xMinYMid meet"
            width={160}
            height={28}
          >
            <title>Fly tally marks</title>
            {[0, 32, 64, 96, 128].slice(0, groups).map((offset) => {
              const marks = Math.min(5, visible - (offset / 32) * 5);
              return (
                <g key={offset} transform={`translate(${offset}, 0)`}>
                  {["M5 4 l-1 19", "M11 5 l1 19", "M17 4 l-1 19", "M23 5 l1 19"]
                    .slice(0, Math.min(4, marks))
                    .map((path) => (
                      <path key={path} d={path} />
                    ))}
                  {marks === 5 && <path d="M2 22 Q14 14 27 5" />}
                </g>
              );
            })}
          </svg>
        </span>
      )}
    </span>
  );
}
