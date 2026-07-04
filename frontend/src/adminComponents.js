import React from 'react';

export function FieldControl({ field, value, onChange }) {
  if (field.type === 'image') {
    function handleImageUpload(event) {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => onChange(reader.result);
      reader.readAsDataURL(file);
    }

    return (
      <div className="admin-field admin-image-field">
        <span>{field.label}</span>
        <input
          type="url"
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Paste image link"
        />
        <div className="admin-image-tools">
          <label className="admin-file-picker">
            <input accept="image/*" type="file" onChange={handleImageUpload} />
            <span>Upload from gallery</span>
          </label>
          {value ? (
            <button className="secondary-action compact-action" type="button" onClick={() => onChange('')}>
              Remove image
            </button>
          ) : null}
        </div>
        {value ? (
          <div className="admin-image-preview">
            <img src={value} alt={`${field.label} preview`} />
          </div>
        ) : (
          <small className="admin-field-hint">Use a web image link or upload an image from your device.</small>
        )}
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <label className="admin-field">
        <span>{field.label}</span>
        <textarea
          className="admin-textarea"
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label className="admin-check">
        <input
          checked={Boolean(value)}
          type="checkbox"
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>{field.label}</span>
      </label>
    );
  }

  if (field.type === 'select') {
    return (
      <label className="admin-field">
        <span>{field.label}</span>
        <select
          required={Boolean(field.required)}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="" disabled>
            Select {field.label.toLowerCase()}
          </option>
          {(field.options || []).map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="admin-field">
      <span>{field.label}</span>
      <input
        type={field.type || 'text'}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function CollectionEditor({
  config,
  items,
  draft,
  onDraftChange,
  onItemChange,
  onCreate,
  onSave,
  onDelete,
  feedback,
}) {
  return (
    <section className="admin-panel-block">
      <div className="admin-panel-head">
        <div>
          <p className="section-tag">{config.title}</p>
          <h3>{config.createLabel}</h3>
        </div>
        {feedback ? <span className="admin-feedback">{feedback}</span> : null}
      </div>

      <div className="admin-card resource-draft">
        <div className="admin-form-grid">
          {config.fields.map((field) => (
            <FieldControl
              field={field}
              key={field.key}
              value={draft[field.key]}
              onChange={(value) => onDraftChange(field.key, value)}
            />
          ))}
        </div>
        <div className="admin-actions">
          <button className="primary-action" type="button" onClick={onCreate}>
            {config.createLabel}
          </button>
        </div>
      </div>

      <div className="resource-list">
        {items.map((item) => (
          <article className="admin-card resource-item" key={item.id}>
            <div className="admin-form-grid">
              {config.fields.map((field) => (
                <FieldControl
                  field={field}
                  key={field.key}
                  value={item[field.key]}
                  onChange={(value) => onItemChange(item.id, field.key, value)}
                />
              ))}
            </div>
            <div className="admin-actions">
              <button className="primary-action" type="button" onClick={() => onSave(item)}>
                Save
              </button>
              <button className="secondary-action" type="button" onClick={() => onDelete(item.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
