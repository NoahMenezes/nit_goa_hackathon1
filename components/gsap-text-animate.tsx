import React, { useRef, useEffect } from "react";
import gsap from "gsap";

interface GSAPTextAnimateProps {
	children: React.ReactNode;
	className?: string;
	duration?: number;
}

const GSAPTextAnimate: React.FC<GSAPTextAnimateProps> = ({ children, className = "", duration = 1.2 }) => {
	const textRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		if (textRef.current) {
			gsap.fromTo(
				textRef.current,
				{ opacity: 0, y: -30, rotate: -5 },
				{
					opacity: 1,
					y: 0,
					rotate: 0,
					duration,
					ease: "elastic.out(1, 0.5)",
				}
			);
		}
	}, [duration]);

	return (
		<span ref={textRef} className={className}>
			{children}
		</span>
	);
};

export default GSAPTextAnimate;