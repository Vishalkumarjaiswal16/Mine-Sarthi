import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  Mail,
  Phone, 
  MapPin, 
  Linkedin, 
  Twitter, 
  Facebook, 
  Instagram,
  ChevronUp,
  TrendingUp,
  Bot,
  Shield,
  Eye,
  BarChart3,
  Bell,
  CheckCircle2,
  Sparkles,
  Zap,
  Activity,
  Cpu,
  Database,
  Award,
  Rocket,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const Intro = () => {
  const navigate = useNavigate();
  const [notification, setNotification] = useState("");
  const [email, setEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const scrollY = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const statsRef = useRef<HTMLDivElement[]>([]);
  const heroTextRef = useRef<HTMLHeadingElement>(null);

  // Page load animation - smooth entrance
  useEffect(() => {
    const timer = setTimeout(() => setPageLoaded(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Enhanced typing animation for hero text
  useEffect(() => {
    if (!pageLoaded) return undefined;

    const fullText = "MINE SARTHI";
    let currentIndex = 0;
    const typingSpeed = 100;

    const typeWriter = () => {
      if (currentIndex < fullText.length) {
        setTypedText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
        setTimeout(typeWriter, typingSpeed);
      } else {
        setIsTyping(false);
      }
    };

    setTimeout(() => {
      setIsTyping(true);
      typeWriter();
    }, 800);

  }, [pageLoaded]);

  // Mouse tracking for parallax and magnetic effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Smooth scroll handler with parallax
  useEffect(() => {
    const handleScroll = () => {
      scrollY.current = window.scrollY;
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Enhanced particle animation with connections and mining-themed particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      type: 'ore' | 'energy' | 'data';
      color: string;
    }> = [];

    const particleCount = 60;
    const particleTypes = ['ore', 'energy', 'data'];
    const particleColors = {
      ore: 'rgba(34, 197, 94, 0.6)', // green
      energy: 'rgba(59, 130, 246, 0.6)', // blue
      data: 'rgba(168, 85, 247, 0.6)' // purple
    };

    for (let i = 0; i < particleCount; i++) {
      const type = particleTypes[Math.floor(Math.random() * particleTypes.length)] as 'ore' | 'energy' | 'data';
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        type,
        color: particleColors[type],
      });
    }

    let animationFrame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections between nearby particles of same type
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100 && particle.type === otherParticle.type) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = particle.color.replace('0.6', '0.2');
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        });
      });

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Mining-themed particle shapes
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;

        if (particle.type === 'ore') {
          // Diamond/crystal shape for ore
          ctx.beginPath();
          const spikes = 6;
          for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const radius = i % 2 === 0 ? particle.size : particle.size * 0.5;
            const x = particle.x + Math.cos(angle) * radius;
            const y = particle.y + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
        } else if (particle.type === 'energy') {
          // Lightning bolt for energy
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y - particle.size);
          ctx.lineTo(particle.x - particle.size * 0.3, particle.y - particle.size * 0.3);
          ctx.lineTo(particle.x + particle.size * 0.2, particle.y);
          ctx.lineTo(particle.x - particle.size * 0.1, particle.y + particle.size * 0.3);
          ctx.lineTo(particle.x, particle.y + particle.size);
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          // Data stream (wave) for data
          ctx.beginPath();
          for (let i = 0; i < particle.size * 4; i++) {
            const x = particle.x - particle.size * 2 + i;
            const y = particle.y + Math.sin(i * 0.5) * particle.size * 0.5;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        ctx.restore();
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  // Enhanced Intersection Observer with stagger and mining-themed animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add("animate-in");
            }, index * 150);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    const elements = document.querySelectorAll(".scroll-animate");
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Enhanced number counting animation with mining metrics
  useEffect(() => {
    if (!pageLoaded) return undefined;

    // Small delay to ensure smooth entrance
    const startDelay = setTimeout(() => {
      statsRef.current.forEach((card, index) => {
        if (!card) return;

        const finalValue = card.dataset['value'] || "0";
        
        // Only animate numeric values
        const numericValue = parseFloat(finalValue);
        
        if (!isNaN(numericValue) && numericValue > 0) {
          const spanElement = card.querySelector('.stat-value') as HTMLElement;
          if (spanElement) {
            // Stagger each stat animation slightly
            setTimeout(() => {
              let current = 0;
              const duration = 2500; // Longer duration for more dramatic effect
              const steps = 60;
              const increment = numericValue / steps;
              const stepDuration = duration / steps;
              
              const timer = setInterval(() => {
                current += increment;
                if (current >= numericValue) {
                  current = numericValue;
                  clearInterval(timer);
                  // Add a subtle glow effect when animation completes
                  spanElement.style.textShadow = '0 0 20px rgba(34, 197, 94, 0.5)';
                  setTimeout(() => {
                    spanElement.style.textShadow = '';
                  }, 1000);
                }
                spanElement.textContent = current.toFixed(1);
              }, stepDuration);
            }, index * 200); // Increased stagger for more dramatic effect
          }
        }
      });
    }, 1200); // Longer delay to sync with typing animation

    return () => clearTimeout(startDelay);
  }, [pageLoaded]);

  // Magnetic button effect with enhanced feedback
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    button.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) scale(1.05)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "translate(0, 0) scale(1)";
  };

  const handleEnterClick = () => {
    navigate("/login");
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification("Thank you for subscribing!");
    setEmail("");
    setTimeout(() => setNotification(""), 3000);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification("Message sent successfully!");
    setContactName("");
    setContactEmail("");
    setContactMessage("");
    setTimeout(() => setNotification(""), 3000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const socialLinks = [
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
  ];

  const testimonials = [
    {
      name: "John Doe",
      role: "Operations Manager",
      avatar: "JD",
      color: "bg-green-500",
      quote: "MINE SARTHI has revolutionized our mining operations with its predictive maintenance and real-time monitoring.",
    },
    {
      name: "Sarah Miller",
      role: "Safety Officer",
      avatar: "SM",
      color: "bg-blue-500",
      quote: "The AI-powered alerts have significantly improved our safety protocols and reduced downtime.",
    },
    {
      name: "Robert Kim",
      role: "CTO",
      avatar: "RK",
      color: "bg-purple-500",
      quote: "Outstanding analytics and visualization capabilities. A game-changer for mining operations.",
    },
  ];

  const features = [
    {
      icon: Eye,
      title: "Live Monitoring",
      description: "Real-time equipment tracking and performance metrics with advanced visualization.",
      gradient: "from-green-500/20 to-emerald-500/20",
      animation: "animate-pulse-glow",
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Advanced data visualization and predictive insights powered by machine learning.",
      gradient: "from-blue-500/20 to-cyan-500/20",
      animation: "animate-data-flow",
    },
    {
      icon: Bell,
      title: "Smart Alerts",
      description: "AI-driven notifications for maintenance and safety with predictive capabilities.",
      gradient: "from-purple-500/20 to-pink-500/20",
      animation: "animate-alert-pulse",
    },
  ];

  const blogPosts = [
    {
      icon: Bot,
      gradient: "from-green-400 to-blue-500",
      title: "AI in Mining: The Future is Here",
      description: "Discover how artificial intelligence is transforming the mining industry with predictive analytics and automation.",
      category: "Technology",
    },
    {
      icon: TrendingUp,
      gradient: "from-blue-400 to-purple-500",
      title: "Sustainable Mining Practices",
      description: "Learn about eco-friendly mining techniques and how technology is reducing environmental impact.",
      category: "Sustainability",
    },
    {
      icon: Shield,
      gradient: "from-purple-400 to-pink-500",
      title: "Safety First: Smart Monitoring",
      description: "How real-time monitoring systems are improving workplace safety in mining operations worldwide.",
      category: "Safety",
    },
  ];

  const stats = [
    { value: "99.9", suffix: "%", label: "Uptime", icon: Activity },
    { value: "24/7", suffix: "", label: "Monitoring", icon: Cpu },
    { value: "AI", suffix: "", label: "Powered", icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
      {/* Enhanced Particle Canvas Background */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 pointer-events-none transition-opacity duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${pageLoaded ? "opacity-30" : "opacity-0"}`}
      />

      {/* Animated Gradient Background with movement - Clean White Theme */}
      <div className={`absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 transition-opacity duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${pageLoaded ? "opacity-100" : "opacity-0"}`} />
      <div 
        className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.08),transparent_70%)] transition-opacity duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${pageLoaded ? "opacity-100" : "opacity-0"}`}
        style={{
          backgroundPosition: `${mousePosition.x * 0.01}px ${mousePosition.y * 0.01}px`,
        }}
      />

      {/* Floating Decorative Elements with parallax - Clean White Theme */}
      <div className={`absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${pageLoaded ? "opacity-100" : "opacity-0"}`}>
        <div 
          className="absolute top-20 left-20 w-32 h-32 bg-primary/8 rounded-full blur-3xl animate-float-rotate"
          style={{ transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)` }}
        />
        <div 
          className="absolute top-40 right-32 w-40 h-40 bg-primary/6 rounded-full blur-3xl animate-float-slow"
          style={{ 
            animationDelay: "1s",
            transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * -0.015}px)`
          }}
        />
        <div 
          className="absolute bottom-32 left-16 w-36 h-36 bg-primary/8 rounded-full blur-3xl animate-float-rotate"
          style={{ 
            animationDelay: "2s",
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <div
          className={`text-center max-w-5xl mx-auto transition-[opacity,transform] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            pageLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
          }`}
          style={{ transitionDelay: pageLoaded ? "120ms" : "0ms" }}
        >
          {/* Main Title with Enhanced Text Reveal Animation */}
          <div className="mb-8 space-y-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              <span className="block text-foreground mb-2 animate-text-reveal">
                Welcome to
              </span>
              <span 
                ref={heroTextRef}
                className="block bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text text-transparent animate-text-reveal animate-gradient-shift relative"
                style={{ animationDelay: "0.2s", opacity: 1 }}
              >
                {isTyping ? (
                  <>
                    {typedText}
                    <span className="animate-pulse text-green-400">|</span>
                  </>
                ) : (
                  "MINE SARTHI"
                )}
                <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-yellow-400 animate-spin-slow" />
              </span>
            </h1>
            <p 
              className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-text-reveal" 
              style={{ animationDelay: "0.4s" }}
            >
              Your sustainable mining companion, delivering real-time insights, AI-powered analytics, and predictive maintenance for optimized operations.
            </p>
          </div>

          {/* CTA Buttons with Enhanced Magnetic Effect */}
          <div 
            className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-text-reveal transition-[opacity,transform] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              pageLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`} 
            style={{ animationDelay: "0.6s", transitionDelay: pageLoaded ? "250ms" : "0ms" }}
          >
            <Button
              onClick={handleEnterClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              size="lg"
              className="group relative text-lg px-8 py-6 bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:from-primary hover:via-primary/95 hover:to-primary text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50 transition-all duration-500 hover:scale-110 overflow-hidden animate-fade-in-scale hover-shine animate-button-pulse"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-500" />
              <span className="relative z-10 flex items-center animate-slide-fade">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-3 group-hover:scale-110 transition-all duration-300" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Rocket className="absolute top-2 right-2 w-4 h-4 text-white/60 group-hover:text-white group-hover:animate-bounce group-hover:rotate-12 transition-all duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-500" />
            </Button>
          </div>

          {/* Enhanced Social Proof Stats with Mining Icons */}
          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 transition-[opacity,transform] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              pageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: pageLoaded ? "500ms" : "0ms" }}
          >
            {stats.map((stat, index) => {
              const isNumeric = !isNaN(parseFloat(stat.value)) && stat.value !== "24/7" && stat.value !== "AI";
              return (
                <Card
                  key={index}
                  ref={(el) => {
                    if (el) statsRef.current[index] = el;
                  }}
                  data-value={isNumeric ? stat.value : ""}
                  data-suffix={stat.suffix}
                  className={`group glass rounded-modern-xl shadow-depth-xl border-border hover:border-primary/50 transition-all duration-500 hover:scale-110 hover:shadow-glow hover:-translate-y-3 relative overflow-hidden hover-lift animate-card-float ${
                    pageLoaded ? 'animate-bounce-in-elastic' : ''
                  }`}
                  style={{ 
                    animationDelay: `${(index * 150) + 800}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                    <stat.icon className="w-6 h-6 text-green-400" />
                  </div>
                  <CardContent className="p-8 text-center relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-modern-xl" />
                    <div className="text-5xl font-bold text-gradient mb-3 group-hover:scale-125 group-hover:animate-text-glow transition-all duration-500 animate-glow relative z-10">
                      {isNumeric ? (
                        <>
                          <span className="stat-value inline-block">0.0</span>
                          <span className="inline-block">{stat.suffix}</span>
                        </>
                      ) : (
                        <span className="inline-block">{stat.value}</span>
                      )}
                    </div>
                    <div className="text-muted-foreground text-lg font-medium group-hover:text-primary group-hover:font-semibold transition-all duration-300 relative z-10">{stat.label}</div>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Enhanced Feature Cards with Mining Animations */}
          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-6 scroll-animate transition-[opacity,transform] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              pageLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
            style={{ transitionDelay: pageLoaded ? "550ms" : "0ms" }}
          >
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group glass rounded-modern-xl shadow-depth-xl border-border hover:border-primary/50 transition-all duration-500 hover:scale-110 hover:shadow-glow overflow-hidden relative hover-lift animate-fade-in-scale animate-shimmer-card"
                style={{ 
                  transitionDelay: `${index * 0.1}s`,
                  animationDelay: `${index * 0.15}s`
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-500" />
                <CardHeader className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-125 group-hover:rotate-12 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-500">
                    <feature.icon className={`w-6 h-6 text-primary group-hover:text-primary group-hover:scale-110 transition-all duration-500 ${feature.animation}`} />
                  </div>
                  <CardTitle className="text-foreground text-xl group-hover:text-primary group-hover:scale-105 transition-all duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-muted-foreground group-hover:text-foreground group-hover:font-medium transition-all duration-300">
                    {feature.description}
                  </p>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-success to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section with Enhanced Stagger */}
      <section
        className={`relative z-10 py-20 px-4 transition-[opacity,transform] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          pageLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
        }`}
        style={{ transitionDelay: pageLoaded ? "700ms" : "0ms" }}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-primary via-data-blue to-success bg-clip-text text-transparent mb-12 scroll-animate">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="group glass rounded-modern-xl shadow-depth-xl border-border hover:border-primary/50 transition-all duration-500 hover:scale-110 hover:shadow-glow-success scroll-animate relative overflow-hidden animate-card-float"
                style={{ 
                  transitionDelay: `${index * 0.1}s`,
                  animationDelay: `${index * 0.2}s`
                }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full group-hover:from-primary/40 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-success/0 opacity-0 group-hover:opacity-100 group-hover:from-primary/5 group-hover:to-success/5 transition-opacity duration-500" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 ${testimonial.color} rounded-full flex items-center justify-center text-white font-bold mr-4 group-hover:scale-125 group-hover:rotate-12 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-500 shadow-lg`}>
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="text-foreground font-semibold group-hover:text-primary group-hover:scale-105 transition-all duration-300">
                        {testimonial.name}
                      </div>
                      <div className="text-muted-foreground text-sm group-hover:text-foreground transition-colors duration-300">{testimonial.role}</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic group-hover:text-foreground group-hover:font-medium transition-all duration-300">
                    "{testimonial.quote}"
                  </p>
                  <div className="mt-4 flex items-center opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500">
                    <Award className="w-4 h-4 text-yellow-400 mr-2 group-hover:animate-bounce" />
                    <span className="text-xs text-yellow-400 font-medium">Verified Customer</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section
        className={`relative z-10 py-20 px-4 transition-[opacity,transform] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          pageLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
        }`}
        style={{ transitionDelay: pageLoaded ? "850ms" : "0ms" }}
      >
        <div className="max-w-2xl mx-auto text-center scroll-animate">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-data-blue to-success bg-clip-text text-transparent mb-4 animate-text-reveal">
            Stay Updated
          </h2>
          <p className="text-muted-foreground mb-8">Get the latest updates on mining technology and MINE SARTHI features.</p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:scale-105 transition-all duration-300 flex-1 max-w-md"
              required
            />
            <Button
              type="submit"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="group relative bg-gradient-to-r from-primary via-data-blue to-success hover:from-primary/90 hover:via-data-blue/90 hover:to-success/90 text-white hover:scale-110 transition-all duration-500 overflow-hidden animate-button-pulse"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-500" />
              <span className="relative z-10">Subscribe</span>
            </Button>
          </form>
        </div>
      </section>

      {/* Enhanced Blog/News Section */}
      <section
        className={`relative z-10 py-20 px-4 transition-[opacity,transform] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          pageLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
        }`}
        style={{ transitionDelay: pageLoaded ? "1000ms" : "0ms" }}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-primary via-data-blue to-success bg-clip-text text-transparent mb-12 scroll-animate">
            Latest Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <Card
                key={index}
                className="group glass rounded-modern-xl shadow-depth-xl border-border hover:border-primary/50 transition-all duration-500 hover:scale-110 hover:shadow-glow-success overflow-hidden scroll-animate relative animate-card-float"
                style={{ 
                  transitionDelay: `${index * 0.15}s`,
                  animationDelay: `${index * 0.2}s`
                }}
              >
                <div className={`h-48 bg-gradient-to-br ${post.gradient} flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform duration-500`}>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-500" />
                  <post.icon className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 group-hover:scale-150 group-hover:rotate-12 group-hover:animate-rotate-glow transition-all duration-500 relative z-10" />
                  <Sparkles className="absolute top-4 right-4 w-6 h-6 text-white/50 group-hover:text-white group-hover:scale-200 group-hover:rotate-180 group-hover:animate-pulse transition-all duration-500" />
                  <Badge className="absolute top-4 left-4 bg-black/50 text-white text-xs group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    {post.category}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-foreground text-xl group-hover:text-primary group-hover:scale-105 transition-all duration-300">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 group-hover:text-foreground group-hover:font-medium transition-all duration-300">
                    {post.description}
                  </p>
                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-3 group-hover:text-lg transition-all duration-300">
                    <span>Read More</span>
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-3 group-hover:scale-125 transition-all duration-300" />
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-success to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* Case Studies Section */}
      <section
        className={`relative z-10 py-20 px-4 transition-[opacity,transform] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          pageLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
        }`}
        style={{ transitionDelay: pageLoaded ? "1120ms" : "0ms" }}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-primary via-data-blue to-success bg-clip-text text-transparent mb-12 scroll-animate">
            Success Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                company: "Iron Ore Mining Corp",
                metric: "35%",
                improvement: "Reduction in maintenance costs",
                description: "Implemented predictive maintenance leading to significant cost savings",
                icon: TrendingUp,
              },
              {
                company: "Copper Extraction Ltd",
                metric: "28%",
                improvement: "Increase in efficiency",
                description: "Real-time monitoring optimized production processes",
                icon: Zap,
              },
            ].map((study, index) => (
              <Card
                key={index}
                className="group glass rounded-modern-xl shadow-depth-xl border-border hover:border-primary/50 transition-all duration-500 hover:scale-110 hover:shadow-glow p-6 scroll-animate relative overflow-hidden animate-card-float"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-success/0 opacity-0 group-hover:opacity-100 group-hover:from-primary/5 group-hover:to-success/5 transition-opacity duration-500" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 group-hover:scale-125 group-hover:rotate-12 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-500">
                    <study.icon className="w-6 h-6 text-primary group-hover:scale-110 group-hover:animate-rotate-glow transition-all duration-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-foreground font-semibold text-lg mb-2 group-hover:text-primary group-hover:scale-105 transition-all duration-300">{study.company}</h3>
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent mb-1 group-hover:scale-110 group-hover:animate-text-glow transition-all duration-500">{study.metric}</div>
                    <p className="text-muted-foreground text-sm mb-2 group-hover:text-foreground group-hover:font-medium transition-all duration-300">{study.improvement}</p>
                    <p className="text-muted-foreground/70 text-xs group-hover:text-muted-foreground transition-colors duration-300">{study.description}</p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-success to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        className={`relative z-10 py-20 px-4 transition-[opacity,transform] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          pageLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
        }`}
        style={{ transitionDelay: pageLoaded ? "1140ms" : "0ms" }}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-primary via-data-blue to-success bg-clip-text text-transparent mb-12 scroll-animate">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                question: "How does MINE SARTHI help optimize energy usage in mining operations?",
                answer: "MINE SARTHI provides real-time monitoring of energy consumption across all mining equipment, AI-powered analytics to identify optimization opportunities, and predictive maintenance to prevent energy waste from equipment inefficiencies. Our system tracks energy usage patterns and provides actionable recommendations to reduce consumption while maintaining operational efficiency.",
              },
              {
                question: "What makes MINE SARTHI a sustainable mining solution?",
                answer: "MINE SARTHI promotes sustainable mining by optimizing energy consumption, integrating renewable energy sources (solar, wind, battery storage), reducing waste through predictive maintenance, and providing comprehensive analytics to minimize environmental impact while maximizing operational efficiency.",
              },
              {
                question: "How does predictive maintenance reduce operational costs?",
                answer: "Our AI-powered predictive maintenance system analyzes equipment data to identify potential failures before they occur. This allows for scheduled maintenance during optimal times, preventing costly unplanned downtime, reducing energy waste from inefficient equipment, and extending equipment lifespan.",
              },
              {
                question: "Can MINE SARTHI help with renewable energy integration in mining sites?",
                answer: "Yes, MINE SARTHI includes comprehensive renewable energy monitoring for solar panels, wind turbines, and battery storage systems. The platform tracks energy generation, storage capacity, and helps optimize the use of renewable energy sources to reduce reliance on traditional power grids.",
              },
              {
                question: "How does the digital twin feature improve mining operations?",
                answer: "The 3D digital twin provides a real-time visual representation of your mining equipment and processes. This allows operators to monitor equipment status, identify bottlenecks, optimize workflows, and make data-driven decisions for improved efficiency and reduced energy consumption.",
              },
              {
                question: "What kind of energy savings can mining operations expect with MINE SARTHI?",
                answer: "While results vary by operation, our platform typically helps mining operations achieve 15-35% reduction in energy costs through optimized equipment usage, predictive maintenance preventing energy waste, renewable energy integration, and AI-powered recommendations for operational efficiency improvements.",
              },
            ].map((faq, index) => (
              <Card
                key={index}
                className="group glass rounded-modern-xl shadow-depth-xl border-border hover:border-primary/50 transition-all duration-500 hover:scale-105 hover:shadow-glow scroll-animate relative overflow-hidden animate-card-float"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-success/0 opacity-0 group-hover:opacity-100 group-hover:from-primary/5 group-hover:to-success/5 transition-opacity duration-500" />
                <CardHeader
                  className="cursor-pointer relative z-10"
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground text-lg group-hover:text-primary group-hover:scale-105 transition-all duration-300">{faq.question}</CardTitle>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground group-hover:text-primary transition-all duration-500 ${
                        openFAQ === index ? "rotate-180 scale-125" : "group-hover:scale-110"
                      }`}
                    />
                  </div>
                </CardHeader>
                {openFAQ === index && (
                  <CardContent className="relative z-10 animate-section-fade">
                    <p className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">{faq.answer}</p>
                  </CardContent>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-success to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        className={`relative z-10 py-20 px-4 transition-[opacity,transform] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          pageLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
        }`}
        style={{ transitionDelay: pageLoaded ? "1150ms" : "0ms" }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-primary via-data-blue to-success bg-clip-text text-transparent mb-12 scroll-animate">
            Get In Touch
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="scroll-animate">
              <h3 className="text-2xl font-semibold text-foreground mb-6">Contact Information</h3>
              <div className="space-y-4 mb-8">
                <div className="flex items-center text-muted-foreground group hover:text-foreground transition-all duration-300 p-3 rounded-lg hover:bg-primary/5 hover:scale-105 cursor-pointer">
                  <Mail className="w-5 h-5 text-primary mr-4 group-hover:scale-125 group-hover:rotate-12 group-hover:animate-pulse transition-all duration-300" />
                  <span className="group-hover:font-medium">contact@minesarthi.com</span>
                </div>
                                <div className="flex items-center text-muted-foreground group hover:text-foreground transition-all duration-300 p-3 rounded-lg hover:bg-primary/5 hover:scale-105 cursor-pointer">
                                  <Phone className="w-5 h-5 text-primary mr-4 group-hover:scale-125 group-hover:rotate-12 group-hover:animate-pulse transition-all duration-300" />
                                  <span className="group-hover:font-medium">9210408010</span>
                                </div>
                                <div className="flex items-center text-muted-foreground group hover:text-foreground transition-all duration-300 p-3 rounded-lg hover:bg-primary/5 hover:scale-105 cursor-pointer">
                                  <MapPin className="w-5 h-5 text-primary mr-4 group-hover:scale-125 group-hover:rotate-12 group-hover:animate-pulse transition-all duration-300" />
                                  <span className="group-hover:font-medium">KR MANGALAM UNIVERSITY,SOHNA,GURUGRAM</span>
                                </div>
                              </div>
                              <div className="flex gap-4 flex-wrap">
                                {socialLinks.map((link, index) => (
                                  <a
                                    key={index}
                                    href={link.href}
                                    className="w-10 h-10 rounded-full bg-background/50 border border-border flex items-center justify-center text-foreground hover:bg-primary/20 hover:border-primary/50 hover:scale-150 hover:shadow-lg hover:shadow-primary/30 transition-all duration-500 group animate-card-float"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                    aria-label={`Visit our ${link.label} page`}
                                    title={`Visit our ${link.label} page`}
                                  >
                                    <link.icon className="w-5 h-5 group-hover:rotate-12 group-hover:scale-125 transition-all duration-500" aria-hidden="true" />
                                  </a>
                                ))}
                              </div>
                            </div>
                            <form onSubmit={handleContactSubmit} className="space-y-4 scroll-animate">
                              <div>
                                <label className="block text-foreground text-sm font-medium mb-2">Name</label>
                                <Input
                                  type="text"
                                  value={contactName}
                                  onChange={(e) => setContactName(e.target.value)}
                                  placeholder="Your name"
                                  className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background/80 transition-all duration-300 w-full"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-foreground text-sm font-medium mb-2">Email</label>
                                <Input
                                  type="email"
                                  value={contactEmail}
                                  onChange={(e) => setContactEmail(e.target.value)}
                                  placeholder="Your email"
                                  className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background/80 transition-all duration-300 w-full"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-foreground text-sm font-medium mb-2">Message</label>
                                <textarea
                                  value={contactMessage}
                                  onChange={(e) => setContactMessage(e.target.value)}
                                  placeholder="Your message"
                                  rows={4}
                                  className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background/80 transition-all duration-300 w-full rounded-md border px-4 py-2"
                                  required
                                />
                              </div>
                              <Button
                                type="submit"
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                                className="group relative w-full bg-gradient-to-r from-primary via-data-blue to-success hover:from-primary/90 hover:via-data-blue/90 hover:to-success/90 text-white hover:scale-110 transition-all duration-500 overflow-hidden animate-button-pulse"
                              >
                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-500" />
                                <span className="relative z-10">Send Message</span>
                              </Button>
                            </form>
                          </div>
                        </div>
                      </section>
                
                      {/* Notifications */}
                      {notification && (
                        <div className="fixed top-6 right-6 z-50 bg-success/20 border border-success/50 text-success px-6 py-3 rounded-lg backdrop-blur-sm flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
                          <CheckCircle2 className="w-5 h-5" />
                          {notification}
                        </div>
                      )}
                
                      {/* Scroll to Top Button */}
                      {showScrollTop && (
                        <button
                          onClick={scrollToTop}
                          className="fixed bottom-24 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-primary via-data-blue to-success text-white shadow-lg hover:shadow-xl hover:scale-125 transition-all duration-300 flex items-center justify-center hover:from-primary/90 hover:via-data-blue/90 hover:to-success/90 animate-in fade-in zoom-in-50 duration-300"
                          aria-label="Scroll to top"
                          title="Scroll to top"
                        >
                          <ChevronUp className="w-6 h-6" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  );
                };
                
                export default Intro;
