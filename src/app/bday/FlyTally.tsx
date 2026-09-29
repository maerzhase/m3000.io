import styles from "./page.module.css";

export default function FlyTally({ count }: { count: number }) {
  const visible = Math.min(count, 25);
  const groups = Math.ceil(visible / 5);

  return (
    <span className={styles.flyTally} role="status" aria-live="polite">
      <span className={styles.srOnly}>
        {count > 0 ? `${count} ${count === 1 ? "fly" : "flies"} swatted` : ""}
      </span>
      {count > 0 && (
        <span className={styles.tallyMarks} aria-hidden="true">
          <svg
            viewBox={`0 0 ${groups * 32} 28`}
            width={groups * 32}
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
          {count > 25 && <span className={styles.tallyTotal}>{count}</span>}
        </span>
      )}
    </span>
  );
}
