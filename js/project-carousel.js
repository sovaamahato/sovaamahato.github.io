import { getProjectLightbox } from './project-lightbox.js';

// Accessible chart carousel used by featured project cards.
export class ProjectCarousel {
    constructor(project, helpers = {}) {
        this.projectName = String(project?.name || 'Project');
        this.safeUrl = helpers.safeUrl || (value => String(value || ''));
        this.escapeHtml = helpers.escapeHtml || (value => String(value || ''));
        this.images = this.normalizeImages(project);
        this.index = 0;
        this.root = null;
        this.image = null;
        this.caption = null;
        this.counter = null;
        this.dots = [];
        this.pointerStart = null;
    }

    normalizeImages(project) {
        const gallery = Array.isArray(project?.images)
            ? project.images
            : Array.isArray(project?.gallery)
                ? project.gallery
                : [];
        const candidates = gallery.length > 0
            ? gallery
            : project?.picture
                ? [{
                    src: project.picture,
                    alt: `${this.projectName} project chart`
                }]
                : [];

        return candidates
            .map(image => ({
                src: this.safeUrl(typeof image === 'string' ? image : image?.src),
                alt: this.escapeHtml(
                    typeof image === 'string'
                        ? `${this.projectName} project chart`
                        : image?.alt || `${this.projectName} project chart`
                ),
                caption: this.escapeHtml(
                    typeof image === 'string' ? '' : image?.caption || ''
                )
            }))
            .filter(image => image.src);
    }

    render() {
        if (this.images.length === 0) return null;

        const root = document.createElement('div');
        root.className = 'project-carousel';
        root.tabIndex = 0;
        root.setAttribute('role', 'region');
        root.setAttribute('aria-roledescription', 'carousel');
        root.setAttribute('aria-label', `${this.projectName} chart gallery`);

        const figure = document.createElement('figure');
        figure.className = 'project-carousel-figure';

        const frame = document.createElement('div');
        frame.className = 'project-carousel-frame';

        this.image = document.createElement('img');
        this.image.className = 'project-carousel-image';
        this.image.loading = 'lazy';
        this.image.decoding = 'async';
        this.image.setAttribute('role', 'button');
        this.image.tabIndex = 0;
        this.image.setAttribute(
            'aria-label',
            `Open larger view of ${this.projectName} charts`
        );
        this.image.title = 'Click to enlarge';
        frame.appendChild(this.image);

        const footer = document.createElement('figcaption');
        footer.className = 'project-carousel-footer';

        this.caption = document.createElement('span');
        this.caption.className = 'project-carousel-caption';

        const status = document.createElement('div');
        status.className = 'project-carousel-status';
        status.setAttribute('aria-live', 'polite');
        status.setAttribute('aria-atomic', 'true');

        this.counter = document.createElement('span');
        this.counter.className = 'project-carousel-counter';

        const controls = document.createElement('div');
        controls.className = 'project-carousel-controls';

        if (this.images.length > 1) {
            const previousButton = this.createButton('previous', -1);
            const nextButton = this.createButton('next', 1);
            controls.append(previousButton, nextButton);

            const indicators = document.createElement('div');
            indicators.className = 'project-carousel-indicators';
            indicators.setAttribute('aria-hidden', 'true');

            this.images.forEach(() => {
                const dot = document.createElement('span');
                dot.className = 'project-carousel-dot';
                indicators.appendChild(dot);
                this.dots.push(dot);
            });

            status.append(this.counter, indicators);
        }

        footer.append(this.caption, status, controls);
        figure.append(frame, footer);
        root.appendChild(figure);

        root.addEventListener('keydown', event => this.handleKeydown(event));
        root.addEventListener('click', event => event.stopPropagation());
        root.addEventListener('pointerdown', event => this.handlePointerDown(event));
        root.addEventListener('pointerup', event => this.handlePointerUp(event));
        root.addEventListener('pointercancel', () => {
            this.pointerStart = null;
        });

        this.image.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            this.openLightbox();
        });

        this.image.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            event.stopPropagation();
            this.openLightbox();
        });

        this.root = root;
        this.update();
        return root;
    }

    openLightbox() {
        getProjectLightbox().open({
            images: this.images,
            index: this.index,
            projectName: this.projectName
        });
    }

    createButton(direction, delta) {
        const button = document.createElement('button');
        button.className = `project-carousel-button project-carousel-${direction}`;
        button.type = 'button';
        button.setAttribute('aria-label', `Show ${direction} chart for ${this.projectName}`);
        button.innerHTML = direction === 'previous'
            ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>'
            : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>';
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            this.goTo(this.index + delta);
        });
        return button;
    }

    handleKeydown(event) {
        if (event.target === this.image) return;
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        event.stopPropagation();
        this.goTo(this.index + (event.key === 'ArrowLeft' ? -1 : 1));
    }

    handlePointerDown(event) {
        if (!event.isPrimary || event.pointerType === 'mouse') return;
        if (event.target?.closest?.('.project-carousel-button')) return;
        this.pointerStart = { x: event.clientX, y: event.clientY };
    }

    handlePointerUp(event) {
        if (!this.pointerStart || !event.isPrimary) return;

        const deltaX = event.clientX - this.pointerStart.x;
        const deltaY = event.clientY - this.pointerStart.y;
        this.pointerStart = null;

        if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
        event.stopPropagation();
        this.goTo(this.index + (deltaX < 0 ? 1 : -1));
    }

    goTo(index) {
        if (this.images.length < 2) return;
        this.index = (index + this.images.length) % this.images.length;
        this.update();
    }

    update() {
        const current = this.images[this.index];
        if (!current || !this.image) return;

        this.image.src = current.src;
        this.image.alt = current.alt;
        this.caption.textContent = current.caption;
        this.caption.hidden = !current.caption;

        if (this.counter) {
            this.counter.textContent = `${this.index + 1} / ${this.images.length}`;
            this.counter.setAttribute(
                'aria-label',
                `Chart ${this.index + 1} of ${this.images.length}${current.caption ? `: ${current.caption}` : ''}`
            );
        }

        this.dots.forEach((dot, index) => {
            dot.classList.toggle('is-active', index === this.index);
        });
    }
}
