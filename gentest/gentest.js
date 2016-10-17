/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

window.onload = function() {
 printTest(document.body.children[0], document.body.children[1], document.body.children[2]);
}

function printTest(LTRContainer, RTLContainer, genericContainer) {
  var lines = [
    '/**',
    ' * Copyright (c) 2014-present, Facebook, Inc.',
    ' * All rights reserved.',
    ' *',
    ' * This source code is licensed under the BSD-style license found in the',
    ' * LICENSE file in the root directory of this source tree. An additional grant',
    ' * of patent rights can be found in the PATENTS file in the same directory.',
    ' */',
    '',
  ];

  lines.push('/**');
  lines.push(' * @Generated by gentest/gentest.sh with the following input');
  lines.push(' *');

  var indentation = 0;
  lines.push(genericContainer.innerHTML.split('\n').map(function(line) {
    return line.trim();
  }).filter(function(line) {
    return line.length > 0 && line !== '<div id="default"></div>';
  }).map(function(line) {
    var result;
    if (line.indexOf('</div') == 0) {
      result = '  '.repeat(indentation - 1) + line;
    } else {
      result = '  '.repeat(indentation) + line;
    }

    indentation += (line.match(/<div/g) || []).length;
    indentation -= (line.match(/<\/div/g) || []).length;
    return result;
  }).reduce(function(curr, prev) {
    if (prev.indexOf('<div') == 0) {
      prev = '\n' + prev;
    }
    return curr + '\n' + prev;
  }));
  lines.push(' *');
  lines.push(' */');
  lines.push('');

  lines.push([
    '#include <CSSLayout/CSSLayout.h>',
    '#include <gtest/gtest.h>',
    '',
  ].reduce(function(curr, prev) {
    return curr + '\n' + prev;
  }));

  var LTRLayoutTree = calculateTree(LTRContainer);
  var RTLLayoutTree = calculateTree(RTLContainer);
  var genericLayoutTree = calculateTree(genericContainer);

  for (var i = 0; i < genericLayoutTree.length; i++) {
    lines.push('TEST(CSSLayoutTest, ' + genericLayoutTree[i].name + ') {');

    lines.push('  ' + setupTestTree(
        undefined,
        LTRLayoutTree[i],
        genericLayoutTree[i],
        'root',
        null).reduce(function(curr, prev) {
      return curr + '\n  ' + prev;
    }));

    lines.push('  CSSNodeCalculateLayout(root, CSSUndefined, CSSUndefined, CSSDirectionLTR);');
    lines.push('');

    lines.push('  ' + assertTestTree(LTRLayoutTree[i], 'root', null).reduce(function(curr, prev) {
      return curr + '\n  ' + prev;
    }));
    lines.push('');

    lines.push('  CSSNodeCalculateLayout(root, CSSUndefined, CSSUndefined, CSSDirectionRTL);');
    lines.push('');

    lines.push('  ' + assertTestTree(RTLLayoutTree[i], 'root', null).reduce(function(curr, prev) {
      return curr + '\n  ' + prev;
    }));

    lines.push('\n  CSSNodeFreeRecursive(root);')
    lines.push('}');
    lines.push('');
  }

  printLines(lines);
}

function assertTestTree(node, nodeName, parentName) {
  var lines = [
    'ASSERT_EQ(' + node.left + ', CSSNodeLayoutGetLeft(' + nodeName + '));',
    'ASSERT_EQ(' + node.top + ', CSSNodeLayoutGetTop(' + nodeName + '));',
    'ASSERT_EQ(' + node.width + ', CSSNodeLayoutGetWidth(' + nodeName + '));',
    'ASSERT_EQ(' + node.height + ', CSSNodeLayoutGetHeight(' + nodeName + '));',
  ];

  for (var i = 0; i < node.children.length; i++) {
    lines.push('');
    var childName = nodeName + '_child' + i;
    lines = lines.concat(assertTestTree(node.children[i], childName, nodeName));
  }

  return lines;
}

function setupTestTree(parent, node, genericNode, nodeName, parentName, index) {
  var lines = [
    'const CSSNodeRef ' + nodeName + ' = CSSNodeNew();',
  ];

  for (var style in node.style) {

    // Skip position info for root as it messes up tests
    if (node.declaredStyle[style] === "" &&
        (style == 'position' ||
         style == 'left' ||
         style == 'top' ||
         style == 'right' ||
         style == 'bottom' ||
         style == 'width' ||
         style == 'height')) {
      continue;
    }

    if (node.style[style] !== getDefaultStyleValue(style)) {
      switch (style) {
        case 'direction':
          lines.push('CSSNodeStyleSetDirection(' + nodeName + ', ' +
              directionValue(node.style[style]) + ');');
          break;
        case 'flex-direction':
          lines.push('CSSNodeStyleSetFlexDirection(' + nodeName + ', ' +
              flexDirectionValue(node.style[style]) + ');');
          break;
        case 'justify-content':
          lines.push('CSSNodeStyleSetJustifyContent(' + nodeName + ', ' +
              justifyValue(node.style[style]) + ');');
          break;
        case 'align-content':
          lines.push('CSSNodeStyleSetAlignContent(' + nodeName + ', ' +
              alignValue(node.style[style]) + ');');
          break;
        case 'align-items':
          lines.push('CSSNodeStyleSetAlignItems(' + nodeName + ', ' +
              alignValue(node.style[style]) + ');');
          break;
        case 'align-self':
          if (!parent || node.style[style] !== parent.style['align-items']) {
            lines.push('CSSNodeStyleSetAlignSelf(' + nodeName + ', ' +
                alignValue(node.style[style]) + ');');
          }
          break;
        case 'position':
          lines.push('CSSNodeStyleSetPositionType(' + nodeName + ', ' +
              positionValue(node.style[style]) + ');');
          break;
        case 'flex-wrap':
          lines.push('CSSNodeStyleSetFlexWrap(' + nodeName + ', ' +
              wrapValue(node.style[style]) + ');');
          break;
        case 'overflow':
          lines.push('CSSNodeStyleSetOverflow(' + nodeName + ', ' +
              overflowValue(node.style[style]) + ');');
          break;
        case 'flex-grow':
          lines.push('CSSNodeStyleSetFlexGrow(' + nodeName + ', ' + node.style[style] + ');');
          break;
        case 'flex-shrink':
          lines.push('CSSNodeStyleSetFlexShrink(' + nodeName + ', ' + node.style[style] + ');');
          break;
        case 'flex-basis':
          lines.push('CSSNodeStyleSetFlexBasis(' + nodeName + ', ' +
              pixelValue(node.style[style]) + ');');
          break;
        case 'left':
          if (genericNode.rawStyle.indexOf('start:') >= 0) {
            lines.push('CSSNodeStyleSetPosition(' + nodeName + ', CSSEdgeStart, ' +
                pixelValue(node.style[style]) + ');');
          } else {
            lines.push('CSSNodeStyleSetPosition(' + nodeName + ', CSSEdgeLeft, ' +
                pixelValue(node.style[style]) + ');');
          }
          break;
        case 'top':
          lines.push('CSSNodeStyleSetPosition(' + nodeName + ', CSSEdgeTop, ' +
              pixelValue(node.style[style]) + ');');
          break;
        case 'right':
          if (genericNode.rawStyle.indexOf('end:') >= 0) {
            lines.push('CSSNodeStyleSetPosition(' + nodeName + ', CSSEdgeEnd, ' +
                pixelValue(node.style[style]) + ');');
          } else {
            lines.push('CSSNodeStyleSetPosition(' + nodeName + ', CSSEdgeRight, ' +
                pixelValue(node.style[style]) + ');');
          }
          break;
        case 'bottom':
          lines.push('CSSNodeStyleSetPosition(' + nodeName + ', CSSEdgeBottom, ' +
              pixelValue(node.style[style]) + ');');
          break;
        case 'margin-left':
          if (genericNode.rawStyle.indexOf('margin-start:') >= 0) {
            lines.push('CSSNodeStyleSetMargin(' + nodeName + ', CSSEdgeStart, ' +
                pixelValue(node.style[style]) + ');');
          } else {
            lines.push('CSSNodeStyleSetMargin(' + nodeName + ', CSSEdgeLeft, ' +
                pixelValue(node.style[style]) + ');');
          }
          break;
        case 'margin-top':
          lines.push('CSSNodeStyleSetMargin(' + nodeName + ', CSSEdgeTop, ' +
              pixelValue(node.style[style]) + ');');
          break;
        case 'margin-right':
          if (genericNode.rawStyle.indexOf('margin-end:') >= 0) {
            lines.push('CSSNodeStyleSetMargin(' + nodeName + ', CSSEdgeEnd, ' +
                pixelValue(node.style[style]) + ');');
          } else {
            lines.push('CSSNodeStyleSetMargin(' + nodeName + ', CSSEdgeRight, ' +
                pixelValue(node.style[style]) + ');');
          }
          break;
        case 'margin-bottom':
          lines.push('CSSNodeStyleSetMargin(' + nodeName + ', CSSEdgeBottom, ' +
              pixelValue(node.style[style]) + ');');
          break;
        case 'padding-left':
          if (genericNode.rawStyle.indexOf('padding-start:') >= 0) {
            lines.push('CSSNodeStyleSetPadding(' + nodeName + ', CSSEdgeStart, ' +
                pixelValue(node.style[style]) + ');');
          } else {
            lines.push('CSSNodeStyleSetPadding(' + nodeName + ', CSSEdgeLeft, ' +
                pixelValue(node.style[style]) + ');');
          }
          break;
        case 'padding-top':
          lines.push('CSSNodeStyleSetPadding(' + nodeName + ', CSSEdgeTop, ' +
              pixelValue(node.style[style]) + ');');
          break;
        case 'padding-right':
          if (genericNode.rawStyle.indexOf('padding-end:') >= 0) {
            lines.push('CSSNodeStyleSetPadding(' + nodeName + ', CSSEdgeEnd, ' +
                pixelValue(node.style[style]) + ');');
          } else {
            lines.push('CSSNodeStyleSetPadding(' + nodeName + ', CSSEdgeRight, ' +
                pixelValue(node.style[style]) + ');');
          }
          break;
        case 'padding-bottom':
          lines.push('CSSNodeStyleSetPadding(' + nodeName + ', CSSEdgeBottom, ' +
              pixelValue(node.style[style]) + ');');
          break;
        case 'border-left-width':
          if (genericNode.rawStyle.indexOf('border-start-width:') >= 0) {
            lines.push('CSSNodeStyleSetBorder(' + nodeName + ', CSSEdgeStart, ' +
                pixelValue(node.style[style]) + ');');
          } else {
            lines.push('CSSNodeStyleSetBorder(' + nodeName + ', CSSEdgeLeft, ' +
                pixelValue(node.style[style]) + ');');
          }
          break;
        case 'border-top-width':
          lines.push('CSSNodeStyleSetBorder(' + nodeName + ', CSSEdgeTop, ' +
              pixelValue(node.style[style]) + ');');
          break;
        case 'border-right-width':
          if (genericNode.rawStyle.indexOf('border-end-width:') >= 0) {
            lines.push('CSSNodeStyleSetBorder(' + nodeName + ', CSSEdgeEnd, ' +
                pixelValue(node.style[style]) + ');');
          } else {
            lines.push('CSSNodeStyleSetBorder(' + nodeName + ', CSSEdgeRight, ' +
                pixelValue(node.style[style]) + ');');
          }
          break;
        case 'border-bottom-width':
          lines.push('CSSNodeStyleSetBorder(' + nodeName + ', CSSEdgeBottom, ' +
              pixelValue(node.style[style]) + ');');
          break;
        case 'width':
          lines.push('CSSNodeStyleSetWidth(' + nodeName + ', ' +
              pixelValue(node.style[style]) + ');');
          break;
        case 'min-width':
          lines.push('CSSNodeStyleSetMinWidth(' + nodeName + ', ' +
              pixelValue(node.style[style]) + ');');
          break;
        case 'max-width':
          lines.push('CSSNodeStyleSetMaxWidth(' + nodeName + ', ' +
              pixelValue(node.style[style]) + ');');
          break;
        case 'height':
          lines.push('CSSNodeStyleSetHeight(' + nodeName + ', ' +
              pixelValue(node.style[style]) + ');');
          break;
        case 'min-height':
          lines.push('CSSNodeStyleSetMinHeight(' + nodeName + ', ' +
              pixelValue(node.style[style]) + ');');
          break;
        case 'max-height':
          lines.push('CSSNodeStyleSetMaxHeight(' + nodeName + ', ' +
              pixelValue(node.style[style]) + ');');
          break;
      }
    }
  }

  if (parentName) {
    lines.push('CSSNodeInsertChild(' + parentName + ', ' + nodeName + ', ' + index + ');');
  }

  for (var i = 0; i < node.children.length; i++) {
    lines.push('');
    var childName = nodeName + '_child' + i;
    lines = lines.concat(
        setupTestTree(
            node,
            node.children[i],
            genericNode.children[i],
            childName,
            nodeName,
            i));
  }

  return lines;
}

function overflowValue(value) {
  switch (value) {
    case 'visible': return 'CSSOverflowVisible';
    case 'hidden': return 'CSSOverflowHidden';
  }
}

function wrapValue(value) {
  switch (value) {
    case 'wrap': return 'CSSWrapTypeWrap';
    case 'nowrap': return 'CSSWrapTypeNoWrap';
  }
}

function flexDirectionValue(value) {
  switch (value) {
    case 'row': return 'CSSFlexDirectionRow';
    case 'row-reverse': return 'CSSFlexDirectionRowReverse';
    case 'column': return 'CSSFlexDirectionColumn';
    case 'column-reverse': return 'CSSFlexDirectionColumnReverse';
  }
}

function justifyValue(value) {
  switch (value) {
    case 'center': return 'CSSJustifyCenter';
    case 'space-around': return 'CSSJustifySpaceAround';
    case 'space-between': return 'CSSJustifySpaceBetween';
    case 'flex-start': return 'CSSJustifyFlexStart';
    case 'flex-end': return 'CSSJustifyFlexEnd';
  }
}

function positionValue(value) {
  switch (value) {
    case 'absolute': return 'CSSPositionTypeAbsolute';
    default: return 'CSSPositionTypeRelative'
  }
}

function directionValue(value) {
  switch (value) {
    case 'ltr': return 'CSSDirectionLTR';
    case 'rtl': return 'CSSDirectionRTL';
    case 'inherit': return 'CSSDirectionInherit';
  }
}

function alignValue(value) {
  switch (value) {
    case 'auto': return 'CSSAlignAuto';
    case 'center': return 'CSSAlignCenter';
    case 'stretch': return 'CSSAlignStretch';
    case 'flex-start': return 'CSSAlignFlexStart';
    case 'flex-end': return 'CSSAlignFlexEnd';
  }
}

function pixelValue(value) {
  switch (value) {
    case 'auto': return 'CSSUndefined';
    case 'undefined': return 'CSSUndefined';
    default: return value.replace('px', '');
  }
}

function getDefaultStyleValue(style) {
  if (style == 'position') {
    return 'relative';
  }
  var node = document.getElementById('default');
  return getComputedStyle(node, null).getPropertyValue(style);
}

function printLines(lines) {
  console.log(lines.map(function(value) {
    return value + '\n';
  }).reduce(function(prev, curr) {
    return prev + curr;
  }, ''));
}

function calculateTree(root) {
  var rootLayout = [];

  for (var i = 0; i < root.children.length; i++) {
    var child = root.children[i];
    rootLayout.push({
      name: child.id !== '' ? child.id : 'INSERT_NAME_HERE',
      left: child.offsetLeft + child.parentNode.clientLeft,
      top: child.offsetTop + child.parentNode.clientTop,
      width: child.offsetWidth,
      height: child.offsetHeight,
      children: calculateTree(child),
      style: getCSSLayoutStyle(child),
      declaredStyle: child.style,
      rawStyle: child.getAttribute('style'),
    });
  }

  return rootLayout;
}

function getCSSLayoutStyle(node) {
  return [
    'direction',
    'flex-direction',
    'justify-content',
    'align-content',
    'align-items',
    'align-self',
    'position',
    'flex-wrap',
    'overflow',
    'flex-grow',
    'flex-shrink',
    'flex-basis',
    'left',
    'top',
    'right',
    'bottom',
    'margin-left',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'padding-left',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'border-left-width',
    'border-top-width',
    'border-right-width',
    'border-bottom-width',
    'width',
    'min-width',
    'max-width',
    'height',
    'min-height',
    'max-height',
  ].reduce(function(map, key) {
    map[key] = node.style[key] || getComputedStyle(node, null).getPropertyValue(key);
    return map;
  }, {});
}
