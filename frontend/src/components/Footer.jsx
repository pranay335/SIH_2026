const Footer = () => {
    const socialLinks = [
        { name: 'Facebook', icon: '📘', url: '#' },
        { name: 'Twitter', icon: '🐦', url: '#' },
        { name: 'Instagram', icon: '📷', url: '#' },
        { name: 'LinkedIn', icon: '💼', url: '#' }
    ];

    const quickLinks = [
        { label: 'About Us', href: '#about' },
        { label: 'How It Works', href: '#features' },
        { label: 'Contact', href: '#contact' },
        { label: 'Privacy Policy', href: '#privacy' },
        { label: 'Terms of Service', href: '#terms' }
    ];

    return (
        <footer className="border-t border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-2xl font-bold text-gradient mb-4">CivicMind</h3>
                        <p className="text-gray-600 mb-4 max-w-md">
                            Empowering citizens to actively participate in local governance and community development.
                            Together, we build better neighborhoods.
                        </p>
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <span>🌍</span>
                            <span>Supporting UN SDG 11: Sustainable Cities and Communities</span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-gray-900 font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            {quickLinks.map((link, index) => (
                                <li key={index}>
                                    <a
                                        href={link.href}
                                        className="text-gray-600 hover:text-[#3B82F6] transition-colors duration-300"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Social Media */}
                    <div>
                        <h4 className="text-gray-900 font-semibold mb-4">Follow Us</h4>
                        <div className="flex gap-4">
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.url}
                                    className="w-10 h-10 flex items-center justify-center glass glass-hover rounded-lg text-xl hover:scale-110 transition-transform duration-300"
                                    aria-label={social.name}
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-200 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} CivicMind. All rights reserved.
                        </p>
                        <div className="flex gap-6 text-sm">
                            <a href="#privacy" className="text-gray-500 hover:text-[#3B82F6] transition-colors">
                                Privacy
                            </a>
                            <a href="#terms" className="text-gray-500 hover:text-[#3B82F6] transition-colors">
                                Terms
                            </a>
                            <a href="#cookies" className="text-gray-500 hover:text-[#3B82F6] transition-colors">
                                Cookies
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
