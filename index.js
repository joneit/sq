window.onload = function() {
    const GW = 4, // Gutter Width
        HW = GW / 2, // Half gutter Width
        container = document.querySelector('.content-container'),
        propset = {
            false: { mouse: 'clientY', offset: 'offsetY', edge: 'top', measure: 'height', otherEdge: 'bottom' },
            true: { mouse: 'clientX', offset: 'offsetX', edge: 'left', measure: 'width', otherEdge: 'right' }
        },
        adjuster = {
            left: 'clientX', right: 'clientX',
            top: 'clientY', bottom: 'clientY',
        };

    container.addEventListener('contextmenu', function(e) {
        if (e.target.classList.contains('content-box')) {
            e.preventDefault();
            splitBox(e);
        }
    });

    function splitBox(e) {
        const el = e.target,
            verticality = e.ctrlKey,
            prop = propset[verticality],
            rect = el.getBoundingClientRect(),
            newEl = el.cloneNode(true),
            style = window.getComputedStyle(el),
            m = e[prop.offset];

        el.style[prop.measure] = m - HW + 'px';
        newEl.style[prop.measure] = rect[prop.measure] - m - HW + 'px';
        newEl.style[prop.edge] = parseInt(style[prop.edge]) + m + HW + 'px';

        el.parentElement.insertBefore(newEl, el.nextElementSibling);

        edges = findEdges(container.children, e);
    }

    var edges;


    // light up edges on mouse down if not already lit AND record adjustments to mouse position
    container.addEventListener('mousedown', function(e) {
        if (e.target === container) {
            edges = edges || findEdges(container.children, e);

            Object.keys(adjuster).forEach(function(key) {
                if (edges[key]) {
                    edges[key].adj = edges[key].el.getBoundingClientRect()[key] - e[adjuster[key]];
                }
            });

            edges.containerRect = container.getBoundingClientRect();
        }
    });

    // light up edges on mouse move
    document.addEventListener('mousemove', function(e) {
        const rect = edges && edges.containerRect;

        if (rect) {
            // var key = true;
            Object.keys(propset).forEach(function(key) {
                const { mouse, edge: edgeName, otherEdge: otherEdgeName, measure} = propset[key];
                var edge;

                if ((edge = edges[edgeName])) {
                    const newEdge = e[mouse] + edge.adj;
                    edge.el.style[measure] = (edge.measure += edge.coord - newEdge) + 'px';
                    edge.el.style[edgeName] = (edge.coord = newEdge) - rect[edgeName] - 1 + 'px';
                }

                if ((edge = edges[otherEdgeName])) {
                    edge.el.style[measure] = e[mouse] + edge.adj - edge.coord + 'px';
                }
            });
        } else {
            edges = findEdges(container.children, e);
        }
    });

    document.addEventListener('mouseup', function(e) {
        if (edges) {
            delete edges.containerRect;
        }
    });

    function findEdges(els, e) {
        const hovering = e.target === container,
            { clientX: x, clientY: y } = e,
            hot = {};

        Array.prototype.forEach.call(els, function(el) {
            const { left, right, top, bottom, width, height } = el.getBoundingClientRect(),
                test = {
                    left: hovering && x + GW > left && left > x,
                    right: hovering && x - GW < right && right < x,
                    top: hovering && y + GW > top && top > y,
                    bottom: hovering && y - GW < bottom && bottom < y
                };

            toggleEdges(test, el);

            hot.left = hot.left || test.left && { el, coord: left, measure: width };
            hot.right = hot.right || test.right && { el, coord: left };
            hot.top = hot.top || test.top && { el, coord: top, measure: height };
            hot.bottom = hot.bottom || test.bottom && { el, coord: top };
        });

        container.style.cursor = hot.left && hot.top ? 'move' :
            hot.left ? 'col-resize' :
                hot.top ? 'row-resize' :
                    'auto';

        return hot;
    }

    function toggleEdges(test, el) {
        Object.keys(test).forEach(function(key) {
            el.classList.toggle(key + '-hover', test[key]);
        });
    }
};