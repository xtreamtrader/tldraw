import React, { useRef, memo } from 'react'
import { useSelector } from 'state'
import styled from 'styles'
import { getShapeUtils } from 'lib/shape-utils'
import { getPage } from 'utils/utils'
import { ShapeType } from 'types'
import useShapeEvents from 'hooks/useShapeEvents'
import * as vec from 'utils/vec'
import { getShapeStyle } from 'lib/shape-styles'

interface ShapeProps {
  id: string
  isSelecting: boolean
  parentPoint: number[]
  parentRotation: number
}

function Shape({ id, isSelecting, parentPoint, parentRotation }: ShapeProps) {
  const shape = useSelector(({ data }) => getPage(data).shapes[id])

  const rGroup = useRef<SVGGElement>(null)

  const events = useShapeEvents(id, shape?.type === ShapeType.Group, rGroup)

  // This is a problem with deleted shapes. The hooks in this component
  // may sometimes run before the hook in the Page component, which means
  // a deleted shape will still be pulled here before the page component
  // detects the change and pulls this component.
  if (!shape) return null

  const isGroup = shape.type === ShapeType.Group

  const center = getShapeUtils(shape).getCenter(shape)

  const transform = `
  rotate(${shape.rotation * (180 / Math.PI)}, ${vec.sub(center, parentPoint)})
  translate(${vec.sub(shape.point, parentPoint)})
  `

  const style = getShapeStyle(shape.style)

  return (
    <>
      <StyledGroup ref={rGroup} transform={transform}>
        {isSelecting && !isGroup && (
          <HoverIndicator
            as="use"
            href={'#' + id}
            strokeWidth={+style.strokeWidth + 4}
            variant={getShapeUtils(shape).canStyleFill ? 'filled' : 'hollow'}
            {...events}
          />
        )}
        {!shape.isHidden && <StyledShape as="use" href={'#' + id} {...style} />}
        {isGroup &&
          shape.children.map((shapeId) => (
            <Shape
              key={shapeId}
              id={shapeId}
              isSelecting={isSelecting}
              parentPoint={shape.point}
              parentRotation={shape.rotation}
            />
          ))}
      </StyledGroup>
    </>
  )
}

const StyledShape = styled('path', {
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  pointerEvents: 'none',
})

const HoverIndicator = styled('path', {
  stroke: '$selected',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  transform: 'all .2s',
  fill: 'transparent',
  filter: 'url(#expand)',
  variants: {
    variant: {
      hollow: {
        pointerEvents: 'stroke',
      },
      filled: {
        pointerEvents: 'all',
      },
    },
  },
})

const StyledGroup = styled('g', {
  [`& ${HoverIndicator}`]: {
    opacity: '0',
  },
  [`&:hover ${HoverIndicator}`]: {
    opacity: '0.16',
  },
  variants: {
    isSelected: {
      true: {
        [`& ${HoverIndicator}`]: {
          opacity: '0.2',
        },
        [`&:hover ${HoverIndicator}`]: {
          opacity: '0.3',
        },
        [`&:active ${HoverIndicator}`]: {
          opacity: '0.3',
        },
      },
      false: {
        [`& ${HoverIndicator}`]: {
          opacity: '0',
        },
      },
    },
  },
})

function Label({ children }: { children: React.ReactNode }) {
  return (
    <text
      y={4}
      x={4}
      fontSize={12}
      fill="black"
      stroke="none"
      alignmentBaseline="text-before-edge"
      pointerEvents="none"
    >
      {children}
    </text>
  )
}

export { HoverIndicator }

export default memo(Shape)

function pp(n: number[]) {
  return '[' + n.map((v) => v.toFixed(1)).join(', ') + ']'
}
