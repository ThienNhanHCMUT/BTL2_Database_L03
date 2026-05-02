import { motion } from 'framer-motion';
import { Database } from 'lucide-react';
import ProductManagementTabs from './ProductManagementTabs';

export default function ProductPageShell({
  title,
  description,
  actions = null,
  children,
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Database size={18} />
            <span className="text-sm font-semibold uppercase tracking-wide">
              PRODUCT / BTL2 Hệ CSDL
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-white">{title}</h1>
          <p className="text-gray-400 mt-2 max-w-3xl">{description}</p>
        </div>

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>

      <div className="mt-6 mb-6">
        <ProductManagementTabs />
      </div>

      <div className="space-y-6">{children}</div>
    </motion.div>
  );
}
