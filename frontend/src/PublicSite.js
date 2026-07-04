import React, { startTransition } from 'react';

function PublicSite({
  siteData,
  brandAssets,
  projectSearch,
  setProjectSearch,
  productSearch,
  setProductSearch,
  projectCategory,
  setProjectCategory,
  productCategory,
  setProductCategory,
  filteredProjects,
  filteredProducts,
  currencyFormatter,
  bookingForm,
  inquiryForm,
  updateBookingForm,
  updateInquiryForm,
  handleBookingSubmit,
  handleInquirySubmit,
  statusMessage,
}) {
  return (
    <>
      <main className="app-shell">
        <section className="hero-shell">
          <div className="hero-copy">
            <p className="eyebrow">Interior Design and Decor Studio</p>
            <h1>{siteData.home.hero.title}</h1>
            <p className="hero-description">{siteData.home.hero.description}</p>
            <div className="hero-points">
              {siteData.about.facts.map((fact) => (
                <span key={fact}>{fact}</span>
              ))}
            </div>
            <div className="hero-actions">
              <a className="primary-action" href="#consultation">
                Book consultation
              </a>
              <a className="secondary-action" href="#portfolio">
                Explore projects
              </a>
            </div>
            <div className="quick-metrics">
              {siteData.home.highlights.map((highlight) => (
                <article key={highlight.label}>
                  <strong>{highlight.value}</strong>
                  <span>{highlight.label}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="hero-visuals">
            <article className="showroom-frame">
              <img
                alt="MTI Interiors showroom facade with premium wood and gold branding"
                src={brandAssets.showroom}
              />
              <div className="showroom-overlay">
                <span>Signature showroom identity</span>
                <strong>Luxury presentation built around wood, brass tones, and warm lighting.</strong>
              </div>
            </article>

            <article className="brand-card">
              <img alt="MTI Interiors and Decor business identity" src={brandAssets.identity} />
              <div className="brand-card-copy">
                <span>Professional brand language</span>
                <p>
                  {siteData.home.offer.title}. {siteData.home.offer.description}
                </p>
              </div>
            </article>
          </div>
        </section>

        <section className="action-dock" aria-label="Popular actions">
          {[
            ['#services', 'Choose a service', 'Curtains, blinds, flooring, wallpaper, and styling.'],
            ['#portfolio', 'Browse completed work', `${filteredProjects.length} matching project${filteredProjects.length === 1 ? '' : 's'} available.`],
            ['#catalog', 'Review catalog pieces', `${filteredProducts.length} matching item${filteredProducts.length === 1 ? '' : 's'} available.`],
            ['#consultation', 'Book a consultation', 'Share room details and preferred visit time.'],
          ].map(([href, title, copy]) => (
            <a className="action-dock-item" href={href} key={title}>
              <strong>{title}</strong>
              <span>{copy}</span>
            </a>
          ))}
        </section>

        <section className="showcase-strip">
          {[
            {
              image: brandAssets.banner,
              title: 'Distinctive brand presentation',
              copy: 'A visual language built on walnut tones, warm gold accents, and clean premium layouts.',
            },
            {
              image: brandAssets.letterhead,
              title: 'Professional client touchpoints',
              copy: 'Quotations, proposals, and concept directions presented with a polished and trustworthy feel.',
            },
            {
              image: brandAssets.showroom,
              title: 'A showroom-led customer experience',
              copy: 'Clients can experience materials, ambiance, and styling before finalizing the right solution.',
            },
          ].map((tile) => (
            <article className="showcase-tile" key={tile.title}>
              <img alt={tile.title} src={tile.image} />
              <div>
                <span>{tile.title}</span>
                <p>{tile.copy}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="advantage-section">
          <div className="section-heading compact-heading">
            <p className="section-tag">{siteData.about.eyebrow}</p>
            <h2>{siteData.about.title}</h2>
            <p>{siteData.about.description}</p>
          </div>
        </section>

        <section className="content-grid" id="services">
          <div className="section-heading">
            <p className="section-tag">Services</p>
            <h2>Bespoke Interior Design & Soft Furnishing Services</h2>
          </div>
          <div className="card-grid">
            {siteData.services.map((service) => (
              <article className="info-card" key={service.id}>
                <span className="accent-line" />
                <p className="card-kicker">{service.category}</p>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <div className="card-meta">
                  <span>{service.timeline}</span>
                  <strong>{service.price}</strong>
                </div>
                <a className="card-action-link" href="#consultation">
                  Request this service
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="portfolio-section" id="portfolio">
          <div className="section-heading split-heading">
            <div>
              <p className="section-tag">Portfolio</p>
              <h2>Our Signature Portfolio & Completed Spaces</h2>
            </div>
            <label className="search-field">
              <span>Search projects</span>
              <input
                aria-label="Search projects"
                value={projectSearch}
                onChange={(event) => setProjectSearch(event.target.value)}
                placeholder="Curtains, villa, office..."
              />
            </label>
          </div>
          <div className="filter-row">
            {['All', 'Curtains', 'Wallpapers', 'Flooring', 'Furniture', 'Blinds'].map((category) => (
              <button
                className={projectCategory === category ? 'is-active' : ''}
                key={category}
                type="button"
                onClick={() =>
                  startTransition(() => {
                    setProjectCategory(category);
                  })
                }
              >
                {category}
              </button>
            ))}
          </div>
          <p className="result-summary">
            Showing {filteredProjects.length} project{filteredProjects.length === 1 ? '' : 's'} for {projectCategory.toLowerCase()} spaces.
          </p>
          <div className="portfolio-grid">
            {filteredProjects.map((project, index) => (
              <article className="project-card" key={project.id}>
                <img
                  alt={project.title}
                  className="project-art"
                  src={
                    project.imageUrl ||
                    [brandAssets.showroom, brandAssets.banner, brandAssets.identity, brandAssets.letterhead][index % 4]
                  }
                />
                <div className="project-copy">
                  <div className="project-header">
                    <span>{project.category}</span>
                    <strong>{project.location}</strong>
                  </div>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <a className="card-action-link" href="#consultation">
                    Plan a similar space
                  </a>
                </div>
              </article>
            ))}
          </div>
          {filteredProjects.length === 0 ? (
            <div className="empty-state">
              <strong>No projects matched your search.</strong>
              <span>Try a broader term or switch the category filter.</span>
            </div>
          ) : null}
        </section>

        <section className="catalog-section" id="catalog">
          <div className="section-heading split-heading">
            <div>
              <p className="section-tag">Catalog</p>
              <h2>Curated Material Catalog & Showroom Pieces</h2>
            </div>
            <label className="search-field">
              <span>Search products</span>
              <input
                aria-label="Search products"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Sofa, blinds, flooring..."
              />
            </label>
          </div>
          <div className="filter-row">
            {['All', 'Furniture', 'Decor', 'Blinds', 'Lighting', 'Flooring'].map((category) => (
              <button
                className={productCategory === category ? 'is-active' : ''}
                key={category}
                type="button"
                onClick={() =>
                  startTransition(() => {
                    setProductCategory(category);
                  })
                }
              >
                {category}
              </button>
            ))}
          </div>
          <p className="result-summary">
            Showing {filteredProducts.length} catalog item{filteredProducts.length === 1 ? '' : 's'} in {productCategory.toLowerCase()}.
          </p>
          <div className="card-grid">
            {filteredProducts.map((product) => (
              <article className="product-card" key={product.id}>
                {product.imageUrl ? (
                  <img className="product-image" src={product.imageUrl} alt={product.name} />
                ) : (
                  <div className="product-swatch" style={{ background: product.swatch }} />
                )}
                <p className="card-kicker">{product.category}</p>
                <h3>{product.name}</h3>
                <p>{product.specification}</p>
                <div className="card-meta">
                  <span>{product.material}</span>
                  <strong>{currencyFormatter.format(Number(product.price || 0))}</strong>
                </div>
                <a className="card-action-link" href="#consultation">
                  Ask about availability
                </a>
              </article>
            ))}
          </div>
          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <strong>No catalog items matched your search.</strong>
              <span>Try another material, room type, or finish.</span>
            </div>
          ) : null}
        </section>

        <section className="journal-section" id="journal">
          <div className="section-heading">
            <p className="section-tag">Design Journal</p>
            <h2>Inspirational Design Articles & Styling Tips</h2>
          </div>
          <div className="journal-grid">
            {siteData.blogs.map((blog) => (
              <article className="admin-card journal-card" key={blog.id}>
                <p className="card-kicker">Published article</p>
                <h3>{blog.title}</h3>
                <p>{blog.excerpt}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="testimonial-strip" id="testimonials">
          <div className="section-heading compact-heading section-heading-light">
            <p className="section-tag">Client Feedback</p>
            <h2>What Our Clients Say About Their MTI Experience</h2>
          </div>
          <div className="testimonial-grid">
            {siteData.reviews.map((review) => (
              <article key={review.id}>
                <span>{review.rating}.0 / 5</span>
                <p>{review.comment}</p>
                <strong>{review.name}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="consultation-section" id="consultation">
          <div className="section-heading">
            <p className="section-tag">Consultation and Inquiry</p>
            <h2>Book a visit or send a brief from any device</h2>
          </div>
          <div className="contact-shortcuts">
            <a href={`tel:+92${siteData.contact.primaryPhone.replace(/\D/g, '')}`}>Call {siteData.contact.primaryPhone}</a>
            <a href={siteData.contact.whatsapp} rel="noreferrer" target="_blank">Open WhatsApp</a>
            <a href="#services">Review services</a>
          </div>
          <div className="dual-panel">
            <article className="form-card">
              <p className="card-kicker">Book consultation</p>
              <h2>Schedule a design discussion</h2>
              <div className="booking-summary-panel">
                <span>1</span>
                <p>Share your contact details, preferred time, and project direction. MTI will confirm availability before scheduling.</p>
              </div>
              <form className="booking-form-modern" onSubmit={handleBookingSubmit}>
                <div className="booking-section">
                  <span className="booking-step-label">Client details</span>
                  <div className="form-grid">
                    <input aria-label="Full name" name="name" value={bookingForm.name} onChange={updateBookingForm} placeholder="Full name" required />
                    <input aria-label="Phone number" name="phone" type="tel" value={bookingForm.phone} onChange={updateBookingForm} placeholder="Phone / WhatsApp" required />
                    <input aria-label="Email address" name="email" type="email" value={bookingForm.email} onChange={updateBookingForm} placeholder="Email address" />
                    <select aria-label="Preferred contact method" name="preferredContact" value={bookingForm.preferredContact} onChange={updateBookingForm}>
                      <option value="WhatsApp">Contact by WhatsApp</option>
                      <option value="Phone call">Contact by phone call</option>
                      <option value="Email">Contact by email</option>
                    </select>
                  </div>
                </div>

                <div className="booking-section">
                  <span className="booking-step-label">Appointment</span>
                  <div className="form-grid">
                    <input aria-label="Preferred date" name="date" type="date" value={bookingForm.date} onChange={updateBookingForm} required />
                    <input aria-label="Preferred time" name="time" type="time" value={bookingForm.time} onChange={updateBookingForm} required />
                    <select aria-label="Consultation type" name="consultationType" value={bookingForm.consultationType} onChange={updateBookingForm}>
                      <option value="Studio consultation">Studio consultation</option>
                      <option value="On-site consultation">On-site consultation</option>
                      <option value="Virtual consultation">Virtual consultation</option>
                    </select>
                    <select aria-label="Project timeline" name="urgency" value={bookingForm.urgency} onChange={updateBookingForm}>
                      <option value="Flexible">Flexible timeline</option>
                      <option value="This week">This week</option>
                      <option value="This month">This month</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="booking-section">
                  <span className="booking-step-label">Project brief</span>
                  <div className="form-grid">
                    <input aria-label="Space type" name="spaceType" value={bookingForm.spaceType} onChange={updateBookingForm} placeholder="Space type, e.g. lounge, office" />
                    <input aria-label="Project location" name="location" value={bookingForm.location} onChange={updateBookingForm} placeholder="Project location / area" />
                    <select aria-label="Budget range" name="budgetRange" value={bookingForm.budgetRange} onChange={updateBookingForm}>
                      <option value="">Budget range</option>
                      <option value="Under PKR 100k">Under PKR 100k</option>
                      <option value="PKR 100k - 300k">PKR 100k - 300k</option>
                      <option value="PKR 300k - 700k">PKR 300k - 700k</option>
                      <option value="PKR 700k+">PKR 700k+</option>
                    </select>
                  </div>
                  <textarea aria-label="Project requirements" name="requirements" value={bookingForm.requirements} onChange={updateBookingForm} placeholder="Tell us about room size, services needed, preferred style, and any materials you like" required />
                </div>

                <label className="booking-consent">
                  <input name="consent" type="checkbox" checked={bookingForm.consent} onChange={updateBookingForm} required />
                  <span>I agree that MTI may contact me to confirm this consultation request.</span>
                </label>

                <div className="booking-actions">
                  <button className="primary-action" type="submit">Request consultation</button>
                  <a className="secondary-action" href={siteData.contact.whatsapp} rel="noreferrer" target="_blank">Prefer WhatsApp?</a>
                </div>
                {statusMessage.booking ? <p className="status-text booking-status">{statusMessage.booking}</p> : null}
              </form>
            </article>

            <article className="contact-card">
              <div className="contact-card-media">
                <img alt="MTI Interiors and Decor premium letterhead design" src={brandAssets.letterhead} />
              </div>
              <div className="contact-card-copy">
                <p className="card-kicker">Send a project brief</p>
                <h2>Contact the studio directly</h2>
                <div className="contact-list">
                  <span>{siteData.contact.address}</span>
                  <a href={`tel:+92${siteData.contact.primaryPhone.replace(/\D/g, '')}`}>{siteData.contact.primaryPhone}</a>
                  <a href={`tel:+92${siteData.contact.secondaryPhone.replace(/\D/g, '')}`}>{siteData.contact.secondaryPhone}</a>
                  <a href={siteData.contact.whatsapp} rel="noreferrer" target="_blank">WhatsApp conversation</a>
                </div>
                <form onSubmit={handleInquirySubmit}>
                  <div className="form-grid">
                    <input aria-label="Full name" name="name" value={inquiryForm.name} onChange={updateInquiryForm} placeholder="Full name" required />
                    <input aria-label="Email address" name="email" type="email" value={inquiryForm.email} onChange={updateInquiryForm} placeholder="Email address" />
                    <input aria-label="Subject" name="subject" value={inquiryForm.subject} onChange={updateInquiryForm} placeholder="Subject" required />
                    <input aria-label="Phone or WhatsApp" name="phone" type="tel" value={inquiryForm.phone} onChange={updateInquiryForm} placeholder="Phone or WhatsApp" />
                  </div>
                  <textarea aria-label="Project message" name="message" value={inquiryForm.message} onChange={updateInquiryForm} placeholder="Share project dimensions, style direction, and budget range" required />
                  <div className="button-row">
                    <button className="primary-action" type="submit">Send inquiry</button>
                    <a className="secondary-action" href={siteData.contact.whatsapp} rel="noreferrer" target="_blank">Chat on WhatsApp</a>
                  </div>
                  {statusMessage.inquiry ? <p className="status-text">{statusMessage.inquiry}</p> : null}
                </form>
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-block">
          <strong>MTI Interiors & Decor</strong>
          <p>Premium interior and decor solutions for homes, offices, and boutique spaces with a professional digital and showroom experience.</p>
        </div>
        <div className="footer-block">
          <span>Core services</span>
          {siteData.services.slice(0, 4).map((service) => (
            <a href="#services" key={service.id}>{service.name}</a>
          ))}
        </div>
        <div className="footer-block">
          <span>Contact</span>
          <a href={`tel:+92${siteData.contact.primaryPhone.replace(/\D/g, '')}`}>{siteData.contact.primaryPhone}</a>
          <a href={`tel:+92${siteData.contact.secondaryPhone.replace(/\D/g, '')}`}>{siteData.contact.secondaryPhone}</a>
          <a href={siteData.contact.whatsapp} rel="noreferrer" target="_blank">WhatsApp</a>
          <p>{siteData.contact.address}</p>
        </div>
      </footer>
    </>
  );
}

export default PublicSite;
