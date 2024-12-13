import React from 'react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

export const GradientButton = ({
  text,
  className,
  size,
  Icon,
  left,
  innerShadow = true,
  ...props
}: {
  text?: string
  className?: string
  size: 'sm' | 'lg'
  left?: boolean
  Icon?: React.ElementType
  innerShadow?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <Button
      {...props}
      className={cn(
        'whitespace-nowrap rounded-2xl bg-primaryGradient text-primary-foreground transition-all duration-300 ease-in-out hover:bg-primaryGradient',
        size === 'sm' ? 'p-4 text-sm sm:p-5' : 'p-6 !text-base',
        innerShadow && 'shadow-inner-bottom',
        className
      )}
      size={size}
    >
      <span className='flex items-center drop-shadow-sm'>
        {Icon && !left && (
          <Icon
            className={cn(
              text
                ? 'relative top-[-0.1rem] mr-2 scale-[1.2]'
                : 'relative top-[-0.1rem] scale-[1.24]'
            )}
          />
        )}

        <span>{text}</span>

        {Icon && left && (
          <Icon
            className={cn(
              text
                ? 'relative ml-1.5 scale-[1.2]'
                : 'relative top-[-0.1rem] scale-[1.24]'
            )}
          />
        )}
      </span>
    </Button>
  )
}
