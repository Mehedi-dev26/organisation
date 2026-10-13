// Blood donation 90-day / 3-month eligibility utility

export function getDonationEligibility(lastDonatedDateStr: string | null) {
  if (!lastDonatedDateStr) {
    return {
      isReady: true,
      remainingDays: 0,
      labelBn: 'প্রস্তুত',
      labelEn: 'Ready',
    };
  }

  const lastDate = new Date(lastDonatedDateStr);
  if (isNaN(lastDate.getTime())) {
    return {
      isReady: true,
      remainingDays: 0,
      labelBn: 'প্রস্তুত',
      labelEn: 'Ready',
    };
  }

  const now = new Date();
  const diffTime = now.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const cooldownDays = 90; // 3 months in Bangladesh blood donation cycle

  if (diffDays >= cooldownDays) {
    return {
      isReady: true,
      remainingDays: 0,
      labelBn: 'প্রস্তুত',
      labelEn: 'Ready',
    };
  } else {
    const remaining = cooldownDays - diffDays;
    return {
      isReady: false,
      remainingDays: remaining,
      labelBn: `বিশ্রামে (${remaining} দিন বাকি)`,
      labelEn: `Resting (${remaining} days left)`,
    };
  }
}

export function formatBengaliDate(dateStr: string | null): string {
  if (!dateStr) return 'তথ্য নেই';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'তথ্য নেই';
    const day = d.getDate();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return 'তথ্য নেই';
  }
}
