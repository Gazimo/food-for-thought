"use client";

import React from "react";
import { FaReddit, FaTelegram, FaTwitter, FaWhatsapp } from "react-icons/fa";

interface SharePopoverProps {
  shareText: string;
  onCopy: () => void;
  onSocialShare: (platform: string) => void;
  onClose: () => void;
}

export const SharePopover: React.FC<SharePopoverProps> = ({
  shareText,
  onCopy,
  onSocialShare,
  onClose,
}) => {
  const handleSocialClick = (platform: string, url: string) => {
    window.open(url, "_blank");
    onSocialShare(platform);
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border p-3 z-50 min-w-[200px]">
        <div className="flex flex-col gap-2">
          <button
            onClick={onCopy}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors text-left"
          >
            <span className="text-lg">📋</span>
            <span className="text-sm">Copy to clipboard</span>
          </button>

          <button
            onClick={() =>
              handleSocialClick(
                "reddit",
                `https://www.reddit.com/submit?url=${encodeURIComponent(
                  "https://f4t.xyz"
                )}&title=${encodeURIComponent(shareText)}`
              )
            }
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors text-left"
          >
            <FaReddit />
            <span className="text-sm">Reddit</span>
          </button>

          <button
            onClick={() =>
              handleSocialClick(
                "telegram",
                `https://t.me/share/url?url=${encodeURIComponent(
                  "https://f4t.xyz"
                )}&text=${encodeURIComponent(shareText)}`
              )
            }
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors text-left"
          >
            <FaTelegram />
            <span className="text-sm">Telegram</span>
          </button>

          <button
            onClick={() =>
              handleSocialClick(
                "twitter",
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  shareText
                )}&url=${encodeURIComponent("https://f4t.xyz")}`
              )
            }
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors text-left"
          >
            <FaTwitter />
            <span className="text-sm">Twitter</span>
          </button>

          <button
            onClick={() =>
              handleSocialClick(
                "whatsapp",
                `https://api.whatsapp.com/send?text=${encodeURIComponent(
                  shareText
                )}`
              )
            }
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors text-left"
          >
            <FaWhatsapp />
            <span className="text-sm">WhatsApp</span>
          </button>
        </div>

        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
      </div>
    </>
  );
};
