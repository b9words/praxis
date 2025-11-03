"use client";

import { useEffect, useState } from "react";
import { useChannelIOApi, useChannelIOEvent } from "react-channel-plugin";

/**
 * ChannelIO Support component using react-channel-plugin hooks
 * This component provides additional ChannelIO functionality and event handling
 * with responsive behavior for mobile vs desktop
 */
const ChannelIOSupport = () => {
  const { showMessenger, hideMessenger, updateUser } = useChannelIOApi();
  const [isMobile, setIsMobile] = useState(false);

  // Detect if user is on mobile device
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind's md breakpoint
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Control ChannelIO visibility based on device type using official API
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ChannelIO) {
      if (isMobile) {
        // On mobile: hide all popups and marketing messages
        window.ChannelIO('hidePopup');
        
        // Apply additional CSS to hide any remaining chat messages/banners
        const styleId = 'channelio-mobile-styles';
        let existingStyle = document.getElementById(styleId);
        
        if (!existingStyle) {
          const style = document.createElement('style');
          style.id = styleId;
          style.textContent = `
            @media (max-width: 767px) {
              /* Hide all chat banners, popups, and text messages on mobile */
              #ch-plugin .ch-plugin-sticky-launcher-text,
              #ch-plugin .ch-plugin-launcher-sticky-text,
              #ch-plugin .ch-plugin-launcher-text,
              #ch-plugin .ch-plugin-launcher-bubble,
              #ch-plugin .ch-plugin-launcher-message,
              #ch-plugin [data-ch-testid="launcher-text"],
              #ch-plugin [data-ch-testid="launcher-bubble"],
              #ch-plugin .ch-plugin-launcher-sticky .ch-plugin-launcher-sticky-text,
              #ch-plugin-frame iframe[title="Channel Plugin"] + div,
              
              /* Hide marketing popups and campaign messages */
              .ch-plugin-popup,
              .ch-plugin-popup-container,
              .ch-plugin-marketing-popup,
              .ch-plugin-campaign-popup,
              .ch-plugin-banner,
              .ch-plugin-notification-banner,
              
              /* Hide text bubbles and welcome messages */
              .ch-plugin-launcher-label,
              .ch-plugin-launcher-label-text,
              .ch-plugin-launcher-welcome,
              .ch-plugin-launcher-welcome-text,
              .ch-plugin-text-bubble,
              .ch-plugin-message-bubble,
              .ch-plugin-notification-popup,
              .ch-plugin-sticky-notification,
              
              /* Hide any element containing common chat text */
              [data-text*="questions"],
              [data-text*="question"],
              [data-text*="help"],
              [data-text*="chat"],
              .ch-plugin-launcher[data-label],
              .ch-plugin-launcher-sticky[data-label] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
              }
              
              /* Keep only the main launcher button visible and properly sized */
              #ch-plugin .ch-plugin-launcher-sticky,
              #ch-plugin .ch-plugin-launcher {
                width: 48px !important;
                height: 48px !important;
                min-width: 48px !important;
                min-height: 48px !important;
              }
              
              /* Hide any containers that might hold messages */
              #ch-plugin .ch-plugin-launcher-sticky-text-container,
              #ch-plugin .ch-plugin-bubble-container,
              #ch-plugin .ch-plugin-notification-container,
              #ch-plugin .ch-plugin-welcome-container,
              .ch-plugin-popup-container,
              .ch-plugin-text-container,
              .ch-plugin-banner-container {
                display: none !important;
              }
            }
          `;
          document.head.appendChild(style);
        }

        // Set up aggressive monitoring for mobile to hide any dynamic content
        const hideMobileContent = () => {
          if (window.ChannelIO) {
            // Hide popups every time they might appear
            window.ChannelIO('hidePopup');
            
            // Find and hide any text content in the plugin
            const chatPlugin = document.getElementById('ch-plugin');
            if (chatPlugin) {
              const allElements = chatPlugin.querySelectorAll('*');
              allElements.forEach(element => {
                const text = element.textContent?.toLowerCase() || '';
                // Check for common chat message phrases
                if (text.includes('question') || 
                    text.includes('help') || 
                    text.includes('chat') || 
                    text.includes('message') ||
                    text.includes('support') ||
                    text.includes('talk') ||
                    text.includes('contact')) {
                  const htmlElement = element as HTMLElement;
                  htmlElement.style.display = 'none';
                  htmlElement.style.visibility = 'hidden';
                  htmlElement.style.opacity = '0';
                }
              });
            }
          }
        };

        // Run immediately and set up interval for continuous monitoring
        hideMobileContent();
        const interval = setInterval(hideMobileContent, 1000);

        // Set up mutation observer for real-time changes
        const observer = new MutationObserver(() => {
          hideMobileContent();
        });

        const startObserving = () => {
          const chatPlugin = document.getElementById('ch-plugin');
          if (chatPlugin) {
            observer.observe(chatPlugin, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeFilter: ['style', 'class', 'data-text']
            });
          } else {
            setTimeout(startObserving, 500);
          }
        };

        startObserving();

        return () => {
          clearInterval(interval);
          observer.disconnect();
        };
      }
    }
  }, [isMobile]);

  // Listen to ChannelIO events and control mobile behavior
  useChannelIOEvent('onShowMessenger', () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ChannelIO messenger opened');
    }
  });

  useChannelIOEvent('onHideMessenger', () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ChannelIO messenger closed');
    }
  });

  useChannelIOEvent('onBadgeChanged', ((...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ChannelIO badge changed:', args[0]);
    }
  }) as any);

  useChannelIOEvent('onChatCreated', ((...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ChannelIO chat created:', args[0]);
    }
  }) as any);

  // Set up direct ChannelIO event listeners for mobile popup control
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ChannelIO && isMobile) {
      // Register popup event listener directly
      window.ChannelIO('onPopupDataReceived', () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('ChannelIO popup detected on mobile - hiding');
        }
        window.ChannelIO('hidePopup');
      });
    }
  }, [isMobile]);

  // Optional: Add global keyboard shortcut to open messenger (desktop only)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + C to open messenger (only on desktop)
      if (!isMobile && (event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        showMessenger();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [showMessenger, isMobile]);

  // This component doesn't render anything visible
  return null;
};

export default ChannelIOSupport;
