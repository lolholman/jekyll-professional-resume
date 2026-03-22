describe('Table of Contents Generation and Scrolling', () => {
  let addEventListenerSpy;

  beforeEach(() => {
    // Prevent multiple DOMContentLoaded listeners from piling up
    addEventListenerSpy = jest.spyOn(document, 'addEventListener');

    // Set up a basic DOM structure
    document.body.innerHTML = `
      <div class="toc-box"></div>
      <div class="subject">
        <h2 class="subject-name">Section 1</h2>
        <div class="item">Item 1.1</div>
        <div class="item">Item 1.2</div>
      </div>
      <div class="subject">
        <h2 class="subject-name">Section 2</h2>
        <div class="item">Item 2.1</div>
      </div>
    `;

    // Load the script
    require('../assets/js/main.js');

    // Manually trigger DOMContentLoaded
    const event = document.createEvent('Event');
    event.initEvent('DOMContentLoaded', true, true);
    document.dispatchEvent(event);
  });

  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
    jest.resetModules();
    addEventListenerSpy.mockRestore();
  });

  test('generates Table of Contents correctly', () => {
    const tocBox = document.querySelector('.toc-box');
    const tocItems = tocBox.querySelectorAll('li');

    expect(tocItems.length).toBe(2);

    expect(tocItems[0].id).toBe('toc-id-Section 1');
    expect(tocItems[0].querySelector('a').textContent).toBe('Section 1');

    expect(tocItems[1].id).toBe('toc-id-Section 2');
    expect(tocItems[1].querySelector('a').textContent).toBe('Section 2');
  });

  test('clicking TOC item scrolls to header', () => {
    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = jest.fn();

    const tocItem = document.querySelector('#toc-id-Section\\ 1');
    tocItem.click();

    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth'
    });
  });
});

describe('Scroll Tracking and Highlighting', () => {
  let intervalCallback;
  let addEventListenerSpy;

  beforeEach(() => {
    jest.useFakeTimers();

    // Prevent multiple DOMContentLoaded listeners from piling up
    addEventListenerSpy = jest.spyOn(document, 'addEventListener');

    // Mock window properties
    Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true });
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    Object.defineProperty(document.documentElement, 'scrollTop', { value: 0, writable: true });

    document.body.innerHTML = `
      <div class="toc-box"></div>
      <div class="subject">
        <h2 class="subject-name" style="top: 100px;">Section 1</h2>
        <div class="item" style="top: 200px;">Item 1.1</div>
        <div class="item" style="top: 300px;">Item 1.2</div>
      </div>
      <div class="subject">
        <h2 class="subject-name" style="top: 1000px;">Section 2</h2>
        <div class="item" style="top: 1100px;">Item 2.1</div>
      </div>
    `;

    const elements = document.querySelectorAll('.subject-name, .subject, .item');
    elements.forEach(el => {
      const style = el.getAttribute('style');
      const top = style ? parseInt(style.replace('top: ', '').replace('px;', '')) : 0;

      el.getBoundingClientRect = jest.fn(() => ({
        top: top,
        bottom: top + 100,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
      }));
    });

    // Isolate the setInterval capture
    const originalSetInterval = window.setInterval;
    window.setInterval = jest.fn((cb) => {
      intervalCallback = cb;
    });

    require('../assets/js/main.js');

    const event = document.createEvent('Event');
    event.initEvent('DOMContentLoaded', true, true);
    document.dispatchEvent(event);

    window.setInterval = originalSetInterval;
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
    jest.resetModules();
    addEventListenerSpy.mockRestore();
  });

  test('scroll interval function highlights current section', () => {
    // Simulate scrolling to just before Section 1 triggers
    // scrollPos = -401, headPos for S1 = 100 + 0 - 500 = -400. (-401 > -400 is false)
    document.documentElement.scrollTop = -401;
    intervalCallback();

    // Nothing should be active
    const tocLink1 = document.getElementById('toc-id-Section 1');
    const tocLink2 = document.getElementById('toc-id-Section 2');
    expect(tocLink1.classList.contains('active')).toBe(false);
    expect(tocLink2.classList.contains('active')).toBe(false);

    // Simulate scrolling past Section 1
    // scrollPos = 0, headPos for S1 = 100 + 0 - 500 = -400. (0 > -400 is true, currHead=S1)
    // headPos for S2 = 1000 + 0 - 500 = 500. (0 > 500 is false)
    document.documentElement.scrollTop = 0;
    intervalCallback();

    expect(tocLink1.classList.contains('active')).toBe(true);
    expect(tocLink2.classList.contains('active')).toBe(false);

    // Simulate scrolling past Section 2
    // scrollPos = 501, headPos for S2 = 1000 + 0 - 500 = 500. (501 > 500 is true, currHead=S2)
    document.documentElement.scrollTop = 501;
    intervalCallback();

    expect(tocLink1.classList.contains('active')).toBe(false);
    expect(tocLink2.classList.contains('active')).toBe(true);
  });

  test('scroll interval function adds appear class to visible contents', () => {
    const contents = document.querySelectorAll('.subject, .item');

    // Initial state: nothing has appear class
    contents.forEach(c => expect(c.classList.contains('appear')).toBe(false));

    // Simulate scroll to show some content
    // contentPos = c.getBoundingClientRect().top + window.scrollY - wh;
    // For item 1 (top: 200): contentPos = 200 + 0 - 1000 = -800
    // If scrollPos < contentPos return.

    // We want scrollPos (-799) to be > contentPos (-800) for item 1 to appear
    document.documentElement.scrollTop = -799;
    intervalCallback();

    expect(document.querySelector('.item[style*="top: 200px"]').classList.contains('appear')).toBe(true);
    expect(document.querySelector('.item[style*="top: 300px"]').classList.contains('appear')).toBe(false);

    // Second scroll to show next item
    // For item 2 (top: 300): contentPos = 300 + 0 - 1000 = -700
    document.documentElement.scrollTop = -699;
    intervalCallback();

    expect(document.querySelector('.item[style*="top: 200px"]').classList.contains('appear')).toBe(true);
    expect(document.querySelector('.item[style*="top: 300px"]').classList.contains('appear')).toBe(true);
  });
});
