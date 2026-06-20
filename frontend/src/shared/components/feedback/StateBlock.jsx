import './feedback.css';

export default function StateBlock({
  title,
  description,
  action,
  variant = 'default',
}) {
  return (
    <div className={`state-block state-block-${variant}`}>
      <div className="state-block-inner">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
        {action ? <div className="state-block-action">{action}</div> : null}
      </div>
    </div>
  );
}
