document.addEventListener('DOMContentLoaded', function(){
    const tocbox = document.querySelector('.toc-box');
    var headers = document.querySelectorAll('.subject-name');

    headers.forEach((h) => {
        let tocItem = document.createElement("li");
        tocItem.id = "toc-id-" + h.textContent;

        let itemLink = document.createElement("a");
        itemLink.classList.add("content-link");
        itemLink.textContent = h.textContent;

        tocItem.append(itemLink);

        tocItem.addEventListener('click', function(){
            h.scrollIntoView({
                behavior: 'smooth'
            });
        });

        tocbox.append(tocItem);
    });

    var contents = document.querySelectorAll('.subject, .item');

    const contentObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appear');
                observer.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: '0px 0px 0px 0px',
        threshold: 0
    });

    contents.forEach(c => {
        if (!c.classList.contains('appear')) {
            contentObserver.observe(c);
        }
    });

    const subjects = document.querySelectorAll('.subject');
    const tocItems = tocbox.querySelectorAll('li');

    const subjectObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                let header = entry.target.querySelector('.subject-name');
                if (header) {
                    tocItems.forEach(tocItem => {
                        tocItem.classList.remove('active');
                    });
                    let tocLink = document.getElementById("toc-id-" + header.textContent);
                    if (tocLink) {
                        tocLink.classList.add('active');
                    }
                }
            }
        });
    }, {
        rootMargin: '-50% 0px -50% 0px'
    });

    subjects.forEach(subject => {
        subjectObserver.observe(subject);
    });

});