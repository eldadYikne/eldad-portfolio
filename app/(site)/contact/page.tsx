import { ContactForm } from '@/components/sections/contact-form'
import { Mail, Phone, MapPin } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact | Eldad Yikne',
  description: 'Get in touch with me for project inquiries, collaborations, or just to say hello.',
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Get In Touch</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Have a project in mind or want to collaborate? Feel free to reach out!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-lg bg-gray-50 dark:bg-gray-800">
              <h2 className="text-xl font-bold mb-4">Contact Information</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <a
                      href="mailto:eldadykn@gmail.com"
                      className="text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      eldadykn@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-sm text-gray-500 dark:text-gray-400">Phone</p>
                    <a
                      href="tel:+972526587480"
                      className="text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      052-6587480
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-sm text-gray-500 dark:text-gray-400">Location</p>
                    <p className="text-gray-900 dark:text-gray-100">Israel</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <h3 className="font-bold mb-2 text-blue-900 dark:text-blue-300">Response Time</h3>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                I typically respond within 24-48 hours during business days.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  )
}
