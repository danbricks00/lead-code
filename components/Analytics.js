import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Enhanced analytics tracking component
const Analytics = () => {
  const router = useRouter();

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    // Track page views
    const handleRouteChange = (url) => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
          page_path: url,
          page_title: document.title,
        });
      }
    };

    // Track Core Web Vitals
    const trackWebVitals = () => {
      if (typeof window !== 'undefined' && window.gtag) {
        // Largest Contentful Paint (LCP)
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          window.gtag('event', 'web_vitals', {
            event_category: 'Web Vitals',
            event_label: 'LCP',
            value: Math.round(lastEntry.startTime),
            non_interaction: true,
          });
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            window.gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'FID',
              value: Math.round(entry.processingStart - entry.startTime),
              non_interaction: true,
            });
          });
        }).observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          window.gtag('event', 'web_vitals', {
            event_category: 'Web Vitals',
            event_label: 'CLS',
            value: Math.round(clsValue * 1000),
            non_interaction: true,
          });
        }).observe({ entryTypes: ['layout-shift'] });
      }
    };

    // Track quote funnel events
    const trackQuoteEvent = (eventName, eventData = {}) => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, {
          event_category: 'Quote Funnel',
          ...eventData,
        });
      }
    };

    // Track chatbot interactions
    const trackChatbotEvent = (eventName, eventData = {}) => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, {
          event_category: 'Chatbot',
          ...eventData,
        });
      }
    };

    // Make tracking functions available globally
    window.trackQuoteEvent = trackQuoteEvent;
    window.trackChatbotEvent = trackChatbotEvent;

    // Track quote funnel stages
    const trackQuoteStarted = () => trackQuoteEvent('quote_started', {
      event_label: 'User started quote process',
    });

    const trackQuoteRoomDetails = (roomCount) => trackQuoteEvent('quote_room_details', {
      event_label: 'Room details collected',
      custom_parameter_1: roomCount,
    });

    const trackQuoteContactInfo = () => trackQuoteEvent('quote_contact_info', {
      event_label: 'Contact information collected',
    });

    const trackQuoteSubmitted = (leadData) => trackQuoteEvent('quote_submitted', {
      event_label: 'Quote successfully submitted',
      value: 1,
      custom_parameter_1: leadData.selectedService,
      custom_parameter_2: leadData.areasCount,
    });

    // Track chatbot events
    const trackChatbotOpened = () => trackChatbotEvent('chatbot_opened', {
      event_label: 'User opened chatbot',
    });

    const trackChatbotMessage = (messageType) => trackChatbotEvent('chatbot_message', {
      event_label: 'User sent message',
      custom_parameter_1: messageType,
    });

    // Make specific tracking functions available
    window.trackQuoteStarted = trackQuoteStarted;
    window.trackQuoteRoomDetails = trackQuoteRoomDetails;
    window.trackQuoteContactInfo = trackQuoteContactInfo;
    window.trackQuoteSubmitted = trackQuoteSubmitted;
    window.trackChatbotOpened = trackChatbotOpened;
    window.trackChatbotMessage = trackChatbotMessage;

    // Initialize tracking
    trackWebVitals();

    // Track initial page view
    handleRouteChange(router.asPath);

    // Listen for route changes
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  // Enhanced conversion tracking for different user actions
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
      // Track scroll depth
      let maxScroll = 0;
      const trackScrollDepth = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.round((scrollTop / docHeight) * 100);
        
        if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
          maxScroll = scrollPercent;
          if (window.gtag) {
            window.gtag('event', 'scroll_depth', {
              event_category: 'Engagement',
              event_label: `${scrollPercent}%`,
              value: scrollPercent,
            });
          }
        }
      };

      // Track time on page
      const startTime = Date.now();
      const trackTimeOnPage = () => {
        const timeOnPage = Math.round((Date.now() - startTime) / 1000);
        if (window.gtag) {
          window.gtag('event', 'time_on_page', {
            event_category: 'Engagement',
            event_label: 'Page engagement time',
            value: timeOnPage,
          });
        }
      };

      // Track form interactions
      const trackFormInteraction = (formElement) => {
        if (window.gtag) {
          window.gtag('event', 'form_interaction', {
            event_category: 'Engagement',
            event_label: 'User interacted with form',
            custom_parameter_1: formElement.name || 'unknown_form',
          });
        }
      };

      // Track external link clicks
      const trackExternalLink = (url) => {
        if (window.gtag) {
          window.gtag('event', 'external_link_click', {
            event_category: 'Outbound',
            event_label: url,
          });
        }
      };

      // Add event listeners
      window.addEventListener('scroll', trackScrollDepth, { passive: true });
      
      // Track form interactions
      document.addEventListener('focus', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          trackFormInteraction(e.target.closest('form') || e.target);
        }
      }, true);

      // Track external link clicks
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.hostname !== window.location.hostname) {
          trackExternalLink(link.href);
        }
      });

      // Track time on page when user leaves
      window.addEventListener('beforeunload', trackTimeOnPage);

      return () => {
        window.removeEventListener('scroll', trackScrollDepth);
        window.removeEventListener('beforeunload', trackTimeOnPage);
      };
  }, []);

  return null; // This component doesn't render anything
};

export default Analytics;
