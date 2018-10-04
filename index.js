'use strict';

window.onload = function() {
    const GW = 4, // Gutter Width
        HW = GW / 2, // Half gutter Width
        MIN_PANE = 32, // MINimum window PANE size
        container = document.querySelector('.content-container'),
        propset = {
            false: { COORD: 'clientY', EDGE: 'top', SPAN: 'height' },
            true: { COORD: 'clientX', EDGE: 'left', SPAN: 'width' }
        };

    var edges;

    container.addEventListener('contextmenu', function(e) {
        for (var el = e.target; el !== document.body; el = el.parentElement) {
            if (el.classList.contains('content-box')) {
                e.preventDefault();
                if (splitBox(e, el)) {
                    edges = findEdges(container.children, e, container);
                }
                break;
            }
        }
    });

    // light up edges on mouse down if not already lit AND record adjustments to mouse position
    container.addEventListener('mousedown', function(e) {
        if (e.target === container) {
            edges = edges || findEdges(container.children, e);

            // `containerRect` is defined on mouseDown and undefined on mouseUp.
            // When defined during mouseMove, moves edges[*]; else defines a new `edges`.
            // It is itself non-enumerable — because it is not a edge.
            Object.defineProperty(edges, 'containerRect', {
                enumerable: false, // !!!
                configurable: true,
                value: container.getBoundingClientRect()
            });

            document.body.style.userSelect = 'none';
        }
    });

    // light up edges on mouse move
    document.addEventListener('mousemove', function(e) {
        const rect = edges && edges.containerRect;

        if (rect) {
            const tooSmall = Object.keys(edges).find(function(barName) {
                var edge = edges[barName];
                if (edge) {
                    const mouseCoord = e[edge.MOUSE_COORD],
                        containerCoord = rect[edge.COORD];

                    var span, style = edge.style = {};
                    if (edge.leader) {
                        span = mouseCoord + edge.delta - edge.coord;
                    } else {
                        const newEdge = mouseCoord + edge.delta;
                        span = (edge.span += edge.coord - newEdge);
                        style[edge.COORD] = (edge.coord = newEdge) - containerCoord - 1 + 'px';
                    }
                    style[edge.SPAN] = span + 'px';

                    return span < MIN_PANE;
                }
            });
            if (!tooSmall) {
                Object.keys(edges).forEach(function(barName) {
                    var edge = edges[barName];
                    if (edge) {
                        Object.assign(edge.el.style, edge.style);
                    }
                });
            }
        } else {
            edges = findEdges(container.children, e);
        }
    });

    document.addEventListener('mouseup', function(e) {
        if (edges) {
            delete edges.containerRect;
            document.body.style.userSelect = null;
        }
    });

    function splitBox(e, el) {
        const
            style = window.getComputedStyle(el || (el = e.target)),
            rect = el.getBoundingClientRect(),
            newEl = el.cloneNode(true),
            verticality = e.ctrlKey,
            prop = propset[verticality],
            m = e[prop.COORD] - rect[prop.EDGE];

        if (rect[prop.SPAN] <= MIN_PANE + GW + MIN_PANE) {
            el.style.cursor = 'not-allowed';
            setTimeout(function() { el.style.cursor = 'auto'; }, 650);
        } else {
            el.style[prop.SPAN] = m - HW + 'px';
            newEl.style[prop.SPAN] = rect[prop.SPAN] - m - HW + 'px';
            newEl.style[prop.EDGE] = parseInt(style[prop.EDGE]) + m + HW + 'px';

            el.parentElement.insertBefore(newEl, el.nextElementSibling);

            return true;
        }
    }

    function findEdges(els, e, target) {
        const hovering = (target || e.target) === container,
            { clientX: x, clientY: y } = e,
            hot = [];

        var hDelta, vDelta;

        Array.prototype.forEach.call(els, function(el) {
            const { left, right, top, bottom, width, height } = el.getBoundingClientRect(),
                test = {
                    left: hovering && x + GW > left && left > x,
                    right: hovering && x - GW < right && right < x,
                    top: hovering && y + GW > top && top > y,
                    bottom: hovering && y - GW < bottom && bottom < y
                };

            toggleEdges(test, el);

            // all detected edges use the same `delta` for their
            // respective types so they all end up aligned

            if (test.right || test.left) {
                if (vDelta === undefined) {
                    vDelta = right - x;
                }
                hot.push({
                    el,
                    // type: 'vert',
                    leader: !test.left,
                    coord: left,
                    span: width,
                    delta: test.right ? vDelta : GW + vDelta,
                    COORD: 'left',
                    OPPOSITE: 'right',
                    SPAN: 'width',
                    MOUSE_COORD: 'clientX'
                });
            }

            if (test.bottom || test.top) {
                if (hDelta === undefined) {
                    hDelta = bottom - y;
                }
                hot.push({
                    el,
                    // type: 'horz',
                    leader: !test.top,
                    coord: top,
                    span: height,
                    delta: test.bottom ? hDelta : GW + hDelta,
                    COORD: 'top',
                    OPPOSITE: 'bottom',
                    SPAN: 'height',
                    MOUSE_COORD: 'clientY'
                });
            }
        });

        container.style.cursor = hDelta !== undefined && vDelta !== undefined ? 'move' :
            hDelta !== undefined ? 'row-resize' :
                vDelta !== undefined ? 'col-resize' :
                    'auto';

        return hot;
    }

    function toggleEdges(test, el) {
        return Object.keys(test).reduce(function(added, key) {
            el.classList.toggle(key + '-hover', test[key]);
            return added || test[key];
        }, false);
    }
};